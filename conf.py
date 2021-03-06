# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
# import os
# import sys
# sys.path.insert(0, os.path.abspath('.'))


# -- Project information -----------------------------------------------------

project = 'AbstractMenus'
copyright = '2021, Nanit'
author = 'Nanit'

# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = [
    "sphinx_rtd_theme"
]

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']


# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
html_theme = 'sphinx_rtd_theme'

html_theme_options = {
	'style_nav_header_background': '#F05454',
	'style_external_links': True,
}

html_css_files = [
    'css/overrides.css',
]

html_js_files = [
    'js/links.js'
]

html_copy_source = False

html_show_sourcelink = False

html_show_sphinx = False

html_favicon = './_static/favicon.ico'

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ['_static']

from pygments.lexers.data import JsonLexer
from pygments.lexer import bygroups
from pygments.token import *
from sphinx.highlighting import lexers

class HoconLexer(JsonLexer):
    name = 'HOCON'
    tag = 'hocon'
    aliases = ['hocon']
    filenames = ['*.hocon']

    tokens = {
        'root': [
            (r'//.*?$', Comment.Single),
            (r'#.*?$', Comment.Single),
            (r'/[$][{][?]?/', Literal.String.Interpol, 'interpolation'),
            (r'/"""/', Literal.String.Double, 'multiline_string'),
            (r'/\b(?:include|url|file|classpath)\b/', Keyword),
            (r'/[()=]/', Punctuation),
            (r'/([\w\-\.]+? *)([{:=]|\+=)/', bygroups(Name.Attribute, Punctuation.Indicator)),
            (r'/[()=]/', Punctuation),
            (r'/\d+\.(\d+\.?){3,}/', Literal),
            (r'/[^\$\"{}\[\]:=,\+#`\^\?!@\*&]+?/', Literal),
        ],
        'string': [
        	(r'/[$][{][?]?/', Literal.String.Interpol, 'interpolation'),
            (r'/[^\\"\${]+/', Literal.String.Double),
        ],
        'multiline_string': [
        	(r'/"[^"]{1,2}/', Literal.String.Double),
            (r'/"""/', Literal.String.Double, '#pop'),
        ],
        'interpolation': [
        	(r'/[\w\-\.]+?/', Name.Variable),
            (r'/}/', Literal.String.Interpol, '#pop'),
        ]
    }


lexers['hocon'] = HoconLexer(startinline=True)