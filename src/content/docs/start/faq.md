---
title: FAQ
description: "This is a collection of frequently asked questions. This will be useful for you, if you don't know how to implement some feature and don't know where to find…"
---

This is a collection of frequently asked questions. This will be useful for you, if you don't know how to implement some feature and don't know where to find information about this in the docs.

Note, that this list will be updated with new questions over time.

:::tip
If you haven't found answer on your question, you always can ask it in our [Discord channel](https://discord.gg/4VGP3Gv)
:::

## Is AbstractMenus supports YAML configs?

AbstractMenus supports only HOCON configs. If this format seems complicated for you, read `hocon` article.

## Where I can use placeholders?

You can use placeholder almost anywhere:

1.  Actions
2.  Rules
3.  Menu title
4.  Item properties

Even if some parameter takes numbers, you can use it, if your placeholder always returns number.

## I added PlaceholderAPI placeholders but it still doesn't work.

First, try to reload menus with `/am reload` command.

If it still doesn't work, check is you downloaded PlaceholderAPI expansion which placeholders you use. If you use player placeholders (for example `%player_name%`), you need to donwload Player expansion:

1.  `/papi ecloud download Player`
2.  `/papi reload`

## Which plugins AbstractMenus support?

You can find list of all supported plugins [here](external-plugins-support).

## Is there some priority to display items?

Each next item in list will be displayed over previous, if they has one slot. You can use rules to filter displaying of these items.

## How to make menu opens when i write command or do something else?

For this AbstractMenus has `../general/activators`. Just add it in your menu and reload plugin.

## How to deny menu opening for player if he have no permission?

For this, AbstractMenus has [open rules](menu-properties). Just add `rules` block to your menu and add desired rules. Inside `denyActions` you can also send some message or other information to player if menu opening denied.

## How to activate some item property depending on the rules?

For this AbstractMenus has special `bindings` property. More about it you can read [here](struct-bindings).

## How to fast add one item in multiple slot?

There is multimple way to describe item slot. You can use numeric, ranged slots, and even slots matrix. More about this read [here](prop-slot).

## How to make head item with skin of who opened menu?

Just user player name placeholder inside `skullOwner` property:

```hocon
skullOwner: "%player_name%"
```

## How to make items update by some interval?

For this AbstractMenus has `updateInterval` menu property. More about this read [here](struct-auto-refresh).

## Can I implement logic conditions like "AND", "OR", "NOT", and their combinations?

Yes. AbstractMenus has logical wrappers and notation to invert any rule result. More about this read [here](logical-not).

## Can I save some state somewhere to use it inside menus?

Yes. AbstractMenus has variables system for this. You can [create, edit and delete](action-var-glob-set) them. To display them, AbstarctMenus has special [placeholders](vars-access).
