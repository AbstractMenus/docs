---
title: Tips
description: "This article contains tips for menu developing. It will be updated periodically."
---

This article contains tips for menu developing. It will be updated periodically.

## Auto reload

While you developing your menus, you usually use `/am reload` command to load changed menu files. AbstractMenus has ability to do it automatically. Just write `/am serve` and plugin will listen for files updates and reload changed or created menus automatically. This action will work every time when you create or save file inside `menus` folder.

To disable it, just write `/am serve` again.

:::caution
This feature preffered only while you actively writing menus. Do not use it after server release.
:::
