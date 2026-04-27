---
title: Templates
description: "Thanks to the flexible HOCON format you can create templates for anything. A template can be any regular parameter, `hocon-obj`, `hocon-list`, etc. Templates…"
---

Thanks to the flexible HOCON format you can create templates for anything. A template can be any regular parameter, `hocon-obj`, `hocon-list`, etc. Templates can be set both inside the menu file, or you can put all templates in a separate file.

## Templates basics

For example, in each of the bunch of menus the "Close menu" button has the same look and parameters. Lets create this button, but not outside of default `items` list. Example:

```hocon
closeButton {
  slot: 5
  texture: "5a6787ba32564e7c2f3a0ce64498ecbb23b89845e5a66b5cec7736f729ed37"
  name: "&cClose"
  lore: "&7Click to close the menu"
  click {
    closeMenu: true
  }
}
```

Since this item outside of items list, this is a template.

Now you can include this template in any place of the menu. For this, you need a special placeholder. This placeholder has format:

```hocon
${<template_name>}
```

Replace `<template_name>` to name of the your template block. In our case this is a `closeButton`. Lets add this template to the `items` list:

```hocon
items: [
  ${closeButton}
]
```

Now after plugin reload, this item will appear in menu.

Note, that path to template always begid from file's root, mo matter where you use placeholder to include it. For example, you have template inside another block:

```hocon
templates {
  items {
    closeButton {
      slot: 5
      texture: "5a6787ba32564e7c2f3a0ce64498ecbb23b89845e5a66b5cec7736f729ed37"
      name: "&cClose"
      lore: "&7Click to close the menu"
      click {
        closeMenu: true
      }
    }
  }
}
```

Then, if `templates` block placed in file's root (doesn't has parent blocks), placeholder to include `closeButton` block will be like this:

```hocon
${templates.items.closeButton}
```

<div class="hint">

<div class="title">

Hint

</div>

Path to template contains all parent blocks names start from first and must be separated by dots.

</div>

The main feature of templates if that you can use them multiple times. But our button template has static slot. To change slot we need to override it in place where we include it.

## Expand or override template

### Override objects

To override our object, we need to use this syntax:

```hocon
items: [
  ${closeButton} {
    slot: 0
  }
]
```

After template placeholder we opened brackets as in default object. And then added item properties as always.

You can add or override any exists properties:

```hocon
items: [
  ${closeButton} {
    slot: 0
    name: "Peter"
    glow: true
  }
]
```

### Override lists

To override list, you need to use similar syntax. For example, we need to set background for menu:

```hocon
// Menu's items list
items: ${myTmpl} [
  ${closeButton} {
    slot: 0
  }
]

// Template
myTmpl: [
  {
    slot: "0-53"
    material: STAINED_GLASS_PANE
    name: " "
  }
]
```

## Templates in separate file

Templates in shared file useful to reuse your templates in multiple menus.

In order to tell the plugin that file is a templates file, you have to specify `#invisible` tag in the first line, otherwise your templates file will be detected by the plugin as a menu file and will produce error.

Below is an example of shared template file:

```hocon
#invisible

btnClose {
  texture: "5a6787ba32564e7c2f3a0ce64498ecbb23b89845e5a66b5cec7736f729ed37"
  name: "&cClose"
  click {
    closeMenu: true
  }
}

btnBack {
  material: ARROW
  name: "&cBack"
}
```

To use this templates you need to include this file inside menu file. For this, you need to use this command:

    include required(file("./plugins/AbstractMenus/menus/<path_to_file>"))

You need to replace `<path_to_file>` to full path to your template file begins from `menus` folder.

In our case, templates file placed in the root of `menus` folder. Then menu file will looks like this:

```hocon
include required(file("./plugins/AbstractMenus/menus/templates.conf"))

title: "Menu title"
size: 6
items: [
  {
    slot: 0
    material: STONE
    name: "Some item"
  },
  ${btnClose} { slot: 1 }
]
```
