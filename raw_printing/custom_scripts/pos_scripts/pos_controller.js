erpnext.PointOfSale.Controller = class extends erpnext.PointOfSale.Controller{
	init_order_summary() {
		this.order_summary = new erpnext.PointOfSale.PastOrderSummary({
			wrapper: this.$components_wrapper,
			events: {
				get_frm: () => this.frm,

				process_return: (name) => {
					this.recent_order_list.toggle_component(false);
					frappe.db.get_doc('POS Invoice', name).then((doc) => {
						frappe.run_serially([
							() => this.make_return_invoice(doc),
							() => this.cart.load_invoice(),
							() => this.item_selector.toggle_component(true)
						]);
					});
				},
				edit_order: (name) => {
					this.recent_order_list.toggle_component(false);
					frappe.run_serially([
						() => this.frm.refresh(name),
						() => this.frm.call('reset_mode_of_payments'),
						() => this.cart.load_invoice(),
						() => this.item_selector.toggle_component(true)
					]);
				},
				delete_order: (name) => {
					frappe.model.delete_doc(this.frm.doc.doctype, name, () => {
						this.recent_order_list.refresh_list();
					});
				},
				new_order: () => {
					frappe.run_serially([
						() => frappe.dom.freeze(),
						() => this.make_new_invoice(),
						() => this.item_selector.toggle_component(true),
						() => frappe.dom.unfreeze(),
					]);
				},
				raw_print: () => {
					this.raw_print(this.frm);
				},
				open_cash_drawer: () => {
					this.open_cash_drawer();
				}
			}
		})
	}

	
	async prepare_app_defaults(data) {
		this.pos_opening = data.name;
		this.company = data.company;
		this.pos_profile = data.pos_profile;
		this.pos_opening_time = data.period_start_date;
		this.item_stock_map = {};
		this.settings = {};

		frappe.db.get_value('Stock Settings', undefined, 'allow_negative_stock').then(({ message }) => {
			this.allow_negative_stock = flt(message.allow_negative_stock) || false;
		});

		frappe.db.get_doc("POS Profile", this.pos_profile).then((profile) => {
			console.log({"profile": profile});
			window.enable_raw_print = profile.enable_raw_printing;
			//Select raw printer
			console.log(window.enable_raw_print);
			if(window.enable_raw_print == 1){
				var d = new frappe.ui.Dialog({
					'fields': [
						{'fieldname': 'printer', 'fieldtype': 'Select', 'reqd': 1, 'label': "Printer"}
					],
					primary_action: function(){
						window.raw_printer = d.get_values().printer;
						d.hide();
					},
					secondary_action: function(){
						d.hide();
					},
					secondary_action_label: "Cancel",
					'title': 'Select printer for Raw Printing'
				});
				console.log({"d": d});
				frappe.ui.form.qz_get_printer_list().then((data) => {
					d.set_df_property('printer', 'options', data);
				});
				d.show();
			}
			window.automatically_print = profile.automatically_print;
			window.open_cash_drawer_automatically = profile.open_cash_drawer_automatically;
			window.enable_weigh_scale = profile.enable_weigh_scale;
			Object.assign(this.settings, profile);
			this.settings.customer_groups = profile.customer_groups.map(group => group.customer_group);
			this.make_app();
		});
	}
	
	init_payments() {
		this.payment = new erpnext.PointOfSale.Payment({
			wrapper: this.$components_wrapper,
			events: {
				get_frm: () => this.frm || {},

				get_customer_details: () => this.customer_details || {},

				toggle_other_sections: (show) => {
					if (show) {
						this.item_details.$component.is(':visible') ? this.item_details.$component.css('display', 'none') : '';
						this.item_selector.$component.css('display', 'none');
					} else {
						this.item_selector.$component.css('display', 'flex');
					}
				},

				submit_invoice: () => {
					//Support for stripe payment because it overwrites its function
					var allowSubmit = 1;
					if(frappe.sys_defaults.installed_apps.indexOf("stripe_terminal")>-1)
					{
						
						if(this.frm.doc.payments.length > 0)
						{
							for (var i=0;i<=this.frm.doc.payments.length;i++) {
								if(this.frm.doc.payments[i] != undefined){
									
									 if(this.frm.doc.payments[i].mode_of_payment == "Stripe" && this.frm.doc.payments[i].base_amount != 0)
									 {
										if(this.frm.doc.payments[i].amount > 0)
										{
											allowSubmit = 0;
										}
										else if(this.frm.doc.is_return == 1 && this.frm.doc.payments[i].card_payment_intent){
											allowSubmit = 0;
										}
										else if(this.frm.doc.is_return == 1 && !this.frm.doc.payments[i].card_payment_intent){
											frappe.throw("This transaction was not paid using a Stripe Payment. Please change the return payment method.");
										}
									 }
								}
							}
						}
					}

					if (allowSubmit == 1){
						this.frm.savesubmit()
							.then((r) => {
								//For raw printing
								this.raw_print(this.frm);							
								
								this.toggle_components(false);
								this.order_summary.toggle_component(true);
								this.order_summary.load_summary_of(this.frm.doc, true);
								frappe.show_alert({
									indicator: 'green',
									message: __('POS invoice {0} created succesfully', [r.doc.name])
								});
							});
					}
					else{
						//var stripe = new erpnext.PointOfSale.StripeTerminal();
						//this.stripe.assign_stripe_connection_token(this,true);
						this.stripe.collecting_payments(this, true);
					}
				},
				
				open_cash_drawer: () => {
					this.open_cash_drawer();
				}
			}
		});
	}
	
	open_cash_drawer(){
		if(window.enable_raw_print == 1 && window.raw_printer){
			var me = this;
			frappe.ui.form.qz_get_printer_list().then(function(printers){
				//console.log(printers);
				var config;
				printers.forEach(function(printer){
					if(printer == window.raw_printer){
						config = qz.configs.create(printer);
					}
				});
				var data = [
					'\x10' + '\x14' + '\x01' + '\x00' + '\x05' //Generate Pulse to kick-out cash drawer
				];
				qz.print(config, data);
			});
		}
	}
	
	raw_print(frm){
		if(window.enable_raw_print == 1 && window.raw_printer){
			var me = this;
			frappe.ui.form.qz_get_printer_list().then(function(printers){
				//console.log(printers);
				var config;
				printers.forEach(function(printer){
					if(printer == window.raw_printer){
						config = qz.configs.create(printer);
					}
				});
				
				var data = [
					'\x1B' + '\x40', //init
					'\x1B' + '\x61' + '\x31', //center align
					frm.doc.company + '\x0A',
					'\x1B' + '\x45' + '\x0D', //bold on
					'Invoice' + '\x0A',
					'\x1B' + '\x45' + '\x0A', //bold off
					'Receipt No: ' + frm.doc.name + '\x0A',
					'Cashier: ' + frm.doc.owner + '\x0A',
					'Customer: ' + frm.doc.customer_name + '\x0A',
					'Date: ' + moment(frm.doc.posting_date).format("MM-DD-YYYY") + '\x0A',
					'Time: ' + frm.doc.posting_time + '\x0A' + '\x0A',
					'\x1B' + '\x61' + '\x30', // left align
					'\x1B' + '\x45' + '\x0D', //bold on
					'Item                                Amount' + '\x0A',
					'\x1B' + '\x45' + '\x0A' //bold off
				];
				frm.doc.items.forEach(function(row){
					var rdata = me.get_item_print(row.item_name, row.qty, row.rate, row.amount);
					console.log(rdata);
					data.push.apply(data, rdata)
				});
				data.push(
					'\x1B' + '\x61' + '\x32' // right align
				);
				var tprint = me.get_total_print(frm.doc);
				data.push.apply(data, tprint);
				data.push('\x1B' + '\x69');   // cut paper (old syntax)
				
				
				var data2 = [
				   '\x1B' + '\x40',          // init
				   '\x1B' + '\x61' + '\x31', // center align
				   'Beverly Hills, CA  90210' + '\x0A',
				   '\x0A',                   // line break
				   'www.qz.io' + '\x0A',     // text and line break
				   '\x0A',                   // line break
				   '\x0A',                   // line break
				   'May 18, 2016 10:30 AM' + '\x0A',
				   '\x0A',                   // line break
				   '\x0A',                   // line break    
				   '\x0A',
				   'Transaction # 123456 Register: 3' + '\x0A',
				   '\x0A',
				   '\x0A',
				   '\x0A',
				   '\x1B' + '\x61' + '\x30', // left align
				   'Baklava (Qty 4)       9.00' + '\x1B' + '\x74' + '\x13' + '\xAA', //print special char symbol after numeric
				   '\x0A',
				   'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' + '\x0A',       
				   '\x1B' + '\x45' + '\x0D', // bold on
				   'Here\'s some bold text!',
				   '\x0A',
				   '\x1B' + '\x45' + '\x0A', // bold off
				   '\x1D' + '\x21' + '\x11', // double font size
				   'Here\'s large text!',
				   '\x0A',
				   '\x1D' + '\x21' + '\x00', // standard font size
				   '\x1B' + '\x61' + '\x32', // right align
				   '\x1B' + '\x21' + '\x30', // em mode on
				   'DRINK ME',
				   '\x1B' + '\x21' + '\x0A' + '\x1B' + '\x45' + '\x0A', // em mode off
				   '\x0A' + '\x0A',
				   '\x1B' + '\x61' + '\x30', // left align
				   '------------------------------------------' + '\x0A',
				   '\x1B' + '\x4D' + '\x31', // small text
				   'EAT ME' + '\x0A',
				   '\x1B' + '\x4D' + '\x30', // normal text
				   '------------------------------------------' + '\x0A',
				   'normal text',
				   '\x1B' + '\x61' + '\x30', // left align
				   '\x0A' + '\x0A' + '\x0A' + '\x0A' + '\x0A' + '\x0A' + '\x0A',
				   '\x1B' + '\x69',          // cut paper (old syntax)
				// '\x1D' + '\x56'  + '\x00' // full cut (new syntax)
				// '\x1D' + '\x56'  + '\x30' // full cut (new syntax)
				// '\x1D' + '\x56'  + '\x01' // partial cut (new syntax)
				// '\x1D' + '\x56'  + '\x31' // partial cut (new syntax)
				   '\x10' + '\x14' + '\x01' + '\x00' + '\x05',  // Generate Pulse to kick-out cash drawer**
																// **for legacy drawer cable CD-005A.  Research before using.
																// see also http://keyhut.com/popopen4.htm
				];
				qz.print(config, data);
			});
		}
	}
	
	get_total_print(doc){
		var ret = [];
		var length = doc.total.toString().length;
		var total = 'Total ';
		for(var i=length; i<=11; i++){
			total = total + ' ';
		}
		ret.push(total + '$' + doc.total.toString() + '\x0A');
		
		//For taxes
		if(doc.taxes && doc.taxes.length > 0){
			doc.taxes.forEach(function(row){
				length = row.total.toString().length;
				total = row.description;
				for(var i=length; i<=11; i++){
					total = total + ' ';
				}
				ret.push(total + '$' + doc.total.toString() + '\x0A');
			});
		}
		
		//Grand Total
		ret.push('\x1B' + '\x45' + '\x0D'); //Bold on
		total = 'Grand Total ';
		length = doc.grand_total.toString().length;
		for(var i=length; i<=11; i++){
			total = total + ' ';
		}
		ret.push(total + '$' + doc.total.toString() + '\x0A');
		ret.push('\x1B' + '\x45' + '\x0A'); //Bold off
		
		//Payments
		var stripe_info = [];
		var cash_drawer = [];
		if(doc.payments && doc.payments.length > 0){
			doc.payments.forEach(function(row){
				length = row.base_amount.toString().length;
				total = row.mode_of_payment;
				for(var i=length; i<=11; i++){
					total = total + ' ';
				}
				ret.push(total + '$' + doc.total.toString() + '\x0A');
				
				//If it's a stripe payment, add mandatory information at end o receipt
				if(row.mode_of_payment=='Stripe' && row.base_amount > 0){
					stripe_info = [
						'\x1B' + '\x61' + '\x31', // center align
						row.card_brand.toUpperCase() + ' XXXXXXXXXXXX' + row.card_last4 + '\x0A',
						'Auth CD: ' + row.card_authorization_code + '\x0A',
						'AID: ' + row.card_dedicated_file_name + '\x0A',
						row.card_application_preferred_name + '\x0A',
						'TVR: ' + row.card_terminal_verification_results + '\x0A',
						'TSI: ' + row.card_transaction_status_information + '\x0A',
						'IAD: ' + row.card_dedicated_file_name
					];
				}
				
				//If it's cash, kick out the cash drawer
				cash_drawer = [
					'\x10' + '\x14' + '\x01' + '\x00' + '\x05' //Generate Pulse to kick-out cash drawer
				]
			});
		}
		
		//Total Payments
		ret.push('\x1B' + '\x45' + '\x0D'); //Bold on
		total = 'Paid Amount ';
		length = doc.grand_total.toString().length;
		for(var i=length; i<=11; i++){
			total = total + ' ';
		}
		ret.push(total + '$' + doc.paid_amount.toString() + '\x0A');
		ret.push('\x1B' + '\x45' + '\x0A'); //Bold off
		
		//Add the stripe data
		if(stripe_info.length > 0){
			ret.push.apply(ret, stripe_info);
		}
		
		//Add the cash drawer kickout
		if(cash_drawer.length > 0){
			ret.push.apply(ret, cash_drawer);
		}
		
		return ret;
	}
	
	get_item_print(item, qty, rate, amount){
		var ilength = item.length;
		var ret = [];
		//Put in for loop in case item length > 31
		for(var i=0; i<ilength; i=i+30){
			ret.push(item.substring(i, i+30) + "\x0A");
		}
		
		//For quantity
		var qty_rate = "$" + rate.toString() + "x " + qty.toString();
		var qlength = qty_rate.length;
		for(var i=0; i<(31-qlength); i++){
			qty_rate = qty_rate + " ";
		}
		
		//Add amount at end of qty-rate line
		var alength = amount.toString().length;
		for(var i=0; i<(10-alength); i++){
			qty_rate = qty_rate + " ";
		}
		qty_rate = qty_rate + "$" + amount.toString();
		ret.push(qty_rate + "\x0A");
		return ret;
	}
}
