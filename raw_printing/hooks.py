from . import __version__ as app_version

app_name = "raw_printing"
app_title = "Raw Printing"
app_publisher = "Pasigono"
app_description = "Raw printing in POS and cash drawer control"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "malisa.aisenyi@gmail.com"
app_license = "MIT"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/raw_printing/css/raw_printing.css"
# app_include_js = "/assets/raw_printing/js/raw_printing.js"
app_include_js = "/assets/js/form-raw.min.js"

# include js, css files in header of web template
# web_include_css = "/assets/raw_printing/css/raw_printing.css"
# web_include_js = "/assets/raw_printing/js/raw_printing.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "raw_printing/public/scss/website"

# include js, css files in header of web form
#webform_include_js = {"pos_invoice": "custom_scripts/frappe/form.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
#page_js = {"point-of-sale" : "custom_scripts/point_of_sale/point_of_sale.js"}

# include js in doctype views
doctype_js = {"pos_profile" : "custom_scripts/pos_profile/pos_profile.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "raw_printing.install.before_install"
# after_install = "raw_printing.install.after_install"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "raw_printing.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
#	},
# }
doc_events = {
	"AccountsController": {
		"validate": "raw_printing.custom_scripts.amount_in_words.validate"
	},
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"raw_printing.tasks.all"
# 	],
# 	"daily": [
# 		"raw_printing.tasks.daily"
# 	],
# 	"hourly": [
# 		"raw_printing.tasks.hourly"
# 	],
# 	"weekly": [
# 		"raw_printing.tasks.weekly"
# 	]
# 	"monthly": [
# 		"raw_printing.tasks.monthly"
# 	]
# }

# Testing
# -------

# before_tests = "raw_printing.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "raw_printing.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "raw_printing.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]


# User Data Protection
# --------------------

user_data_fields = [
	{
		"doctype": "{doctype_1}",
		"filter_by": "{filter_by}",
		"redact_fields": ["{field_1}", "{field_2}"],
		"partial": 1,
	},
	{
		"doctype": "{doctype_2}",
		"filter_by": "{filter_by}",
		"partial": 1,
	},
	{
		"doctype": "{doctype_3}",
		"strict": False,
	},
	{
		"doctype": "{doctype_4}"
	}
]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"raw_printing.auth.validate"
# ]

#For jinja printing
jenv = {
	"methods": [
		"money_in_words:raw_printing.custom_scripts.amount_in_words.money_in_words",
	]
}

