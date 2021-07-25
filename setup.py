from setuptools import setup, find_packages

with open('requirements.txt') as f:
	install_requires = f.read().strip().split('\n')

# get version from __version__ variable in raw_printing/__init__.py
from raw_printing import __version__ as version

setup(
	name='raw_printing',
	version=version,
	description='Raw printing in POS and cash drawer control',
	author='Pasigono',
	author_email='malisa.aisenyi@gmail.com',
	packages=find_packages(),
	zip_safe=False,
	include_package_data=True,
	install_requires=install_requires
)
