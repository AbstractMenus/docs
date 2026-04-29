---
title: Drag and drop
description: "Drag-and-drop (futher DnD) is a feature that allows players to place and take items from inventory. In the same time, menu can change it appearance or…"
---

<div class="audience-tags"><span class="audience-tag audience-author">Menu author</span></div>

Drag-and-drop (futher DnD) is a feature that allows players to place and take items from inventory. In the same time, menu can change it appearance or behaviour in response for this events.

:::note
This feature currently is experimental and has some constraints. For example, you cannot use some DnD actions like placing item by shift-click.
:::

:::tip
Drag-and-drop feature used in some [advanced examples](examples-advanced).
:::
## Adding DnD ability

To allow players place and take items, add `draggable` property to menu root:

```hocon
title: "Menu"
size: 3
draggable: 11
items: [
  // ...
]
```

This property has a [example](/docs/general/item-format/#slot) format. It can accept slot index, range or matrix. In this example we used slot index for single draggable slot. Now if we put or take item from slot 11, this event will not be cancelled.

:::note
Regular menu items cannot be draggable. To place draggable item into menu manually, use `placeItem` action.
:::

## Listening for DnD events

There is 3 actions blocks for DnD which may be added to menu root:

- **`onPlaceItem`** - Called when some item **placed** into draggable slot.

- **`onTakeItem`** - Called when some item **taken** from draggable slot.

- **`onDragItem`** - Called when **any** of the above events happened.

For example, we wat to know when player placed item to the menu. Then we need to use `onPlaceItem`:

```hocon
title: "Menu"
size: 3
draggable: 11
onPlaceItem {
  message: "You placed item in slot 11"
}
items: [
  // ...
]
```

When player put item into available draggable slot, it will receive message.

These events will be called every time player changed item in draggable slot, even if it just increased it's amount.

Event `onDragItem` useful for cases when you need to check draggable slot every time player do sometning in menu.

:::tip
If player closed menu while some items placed in menu, they will be dropped to the ground.
:::
## DnD placeholders

There is special placeholders to check properties of dragged item and other related data. These placeholders uses [example](/docs/advanced/input/) to provide information about dragged item.

DnD placeholders grouped by action types described below. You can play with these placeholders yourself, to understand what kind of data they returns.

### For placed item

Has `placed_` prefix, and contains data about last **placed** item. For example:

- `%placed_item_type%` - return type of last placed item.
- `%placed_item_amount%` - return amount of last placed item.

And so on. See the [reference](/docs/advanced/input/) placeholders for more information.

It also has special placeholder `placed_slot` which returns slot index where item was placed in.

:::note
If player placed item again and increased it amount, these placeholders will contain info about **placed** item, not the final one. If you want to get info about final item, use `changed_` placeholders or `placedItem` rule.
:::

### For taken item

Has `taken_` prefix, and contains data about last **taken** item. For example:

- `%taken_item_type%` - return type of last taken item.
- `%taken_item_amount%` - return amount of last taken item.

It also has special placeholder `taken_slot` which returns slot index from where item was taken.

### For changed item

Has `changed_` prefix, and contains data about final item after placing or taking. For example, if draggable slot has 32 stones, and player put 32 stones again, there will be item with amount `64`. This item available using `changed_` placeholders. If you will use `placed_` placeholder instead, it will return info about placed item with amount `32`.

Usage example:

- `%changed_item_type%` - return type of changed item.
- `%changed_item_amount%` - return amount of changed item.

## Rule `placedItem`

This is a special rule for DnD menus. It allow to check final item inside some draggable slot after placing or taking. Example:

```hocon
title: "Menu"
size: 3
draggable: 11
onDragItem {
  rules {
    placedItem {
      slot: 11
      material: COBBLESTONE
      count: 32
    }
  }
  actions {
    message: "Success"
  }
}
items: [
  // ...
]
```

Here, when player place or take item from slot, it will be checked. If there is at least 32 `COBBLESTONE` items, then player receive `Success` message.

## Special actions

### Action `placeItem`

This action similar to `setButton`, but it places item which can be taken or changed by player using DnD. Example:

```hocon
title: "Menu"
size: 1
activators {
  command: "menu"
}
draggable: [ // Slots 2 and 6
  "--x---x--",
]
onDragItem {
  rules {
    placedItem {
      slot: 2
      material: COBBLESTONE
      count: 32
    }
  }
  actions {
    placeItem {
      slot: 6
      material: COAL_ORE
      count: "%changed_item_amount%"
    }
  }
  denyActions {
    removePlaced: 6
  }
}
items: [
  {
    slot: [
      "xx-xxx-xx"
    ]
    material: BLACK_STAINED_GLASS_PANE
    name: " "
  }
]
```

In this example, if player placed at least 32 cobblestone in slot 2, then coal ore appears in slot 15. Otherwise, remove placed item from slot 15 if exists.

:::tip
You can't place item with this action into non-draggable slot.
:::
:::note
Events like `onPlaceItem` and other won't be called if using this action.
:::

### Action `removePlaced`

Remove placed item from slot. For example, you need to remove item from slot `5`:

```hocon
removePlaced: 5
```

This will fully remove item from inventory.

Or, if you need to remove some amount of items:

```hocon
removePlaced {
  slot: 5
  count: 16
}
```

In this case, if item in slot has amount more than 16, it's amount will be decreased. Otherwise it will be fully removed.
