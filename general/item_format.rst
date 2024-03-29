.. include:: ../_includes/datatypes.rst

.. |ex_below| replace:: See example

Item format
===========

.. include:: ../_includes/contents.rst

An item can be specified not only as a button in a menu. This :ref:`object <hocon-obj>` can be used in rules, actions and activators. However, item always has one format.

.. _prop-all:

All item properties
-------------------

.. csv-table::
	:header: "Name", "Data type", "Example", "Description"
	:widths: 5, 5, 10, 30

	"slot", |t_mult|, |ex_below| :ref:`prop-slot`, "Set slot for item. Not a regular item's property. Can be used only for menu items or in some actions and rules"
	"clickCooldown", |t_int|, ``clickCooldown: 20``, "Set click cooldown in ticks (1 second = 20 ticks). Will be reset after menu closed or refreshed with ``refreshMenu`` action"
	"**Material installers**"
	"material", |t_str|, ``material: "DIAMOND_SWORD"``, "Set the item material by name. On MC ``1.12`` and lower, numerical ids are supported"
	"texture", |t_str|, |ex_below| :ref:`prop-texture`, "Using custom head texture by texture id, url, or base64 encoded. You can find many heads on the https://minecraft-heads.com"
	"skullOwner", |t_str|, |ex_below| :ref:`prop-skull-owner`, "Set player's skin on head"
	"hdb", |t_str|, ``hdb: "2853"``, "Set the head by the identifier from the `HeadDatabase <https://www.spigotmc.org/resources/14280/>`_"
	"mmoitem", |t_str|, ``mmoitem: "WEAPON:MY_SWORD"``, "Take an item by type and id from the `MMOItems <https://www.spigotmc.org/resources/39267/>`_"
	"itemsAdder", |t_str|, ``itemsAdder: "<namespaced id>"``, "Take a custom stack defined in `ItemsAdder <https://www.spigotmc.org/resources/73355/>`_ registry by their namespaced id"
	"oraxen", |t_str|, ``oraxen: "my_sword"``, "Take a custom stack defined in `Oraxen <https://www.spigotmc.org/resources/72448/>`_ plugin"
	"equipItem", |t_str| or |t_obj|, |ex_below| :ref:`prop-equip-item`, "Take item from player's inventory. See all slot types"
	"serialized", |t_str|, |ex_below| :ref:`prop-serialized`, "Deserialize item from base64 string"
	"**Other properties**"
	"name", |t_str|, ``name: "Peter Piper"``, "Set display name"
	"data", |t_int|, ``data: 2``, "Material data (deprecated since MC ``1.13``, full material names are used instead)"
	"count", |t_int|, ``count: 64``, "Amount of item stack"
	"damage", |t_int|, ``damage: 100``, "Set damage (bar under item) for damageable items. The higher the number, the lower the durability of the item"
	"lore", |t_list_str|, |ex_below| :ref:`prop-lore`, "Set item lore (text under name)"
	"glow", |t_bool|, ``glow: true``, "Set glowing effect (via invisible enchantment)"
	"enchantments", |t_obj|, |ex_below| :ref:`prop-ench`, "Add enchantment to item"
	"color", |t_str|, |ex_below|, "Colorize armor or potion"
	"flags", |t_list_str|, |ex_below| :ref:`prop-flags`, "Add item flags"
	"unbreakable", |t_bool|, ``unbreakable: true``, "Make item unbreakable (works on ``1.9+``)"
	"potionData", |t_list_obj|, |ex_below| :ref:`prop-potion`, "Add various potion effects for item, if this item is potion"
	"fireworkData", |t_obj|, |ex_below| :ref:`prop-firework`, "If material is ``FIREWORK_ROCKET``, or ``FIREWORK``, it sets various settings of the fireworks"
	"bookData", |t_obj|, |ex_below| :ref:`prop-book`, "Add book's content and metadata (author, title) for writable book"
	"bannerData", |t_obj|, |ex_below| :ref:`prop-banner`, "Colorize banner item"
	"shieldData", |t_obj|, Similar to :ref:`prop-banner`, "Colorie shield item, as banner"
	"model", |t_int|, ``model: 1234567``, "Custom model data"
	"enchantStore", |t_obj|, Same as :ref:`prop-ench`, "Allows you to save the enchantment in an item that can later be used to enchant items on the anvil. Need for creating an enchantment book (``1.12+``). Works with ``ENCHANTED_BOOK`` material"
	"recipes", |t_list_obj|, "Same as recipe format", "Create a book with custom recipes (knowledge book). Works with ``KNOWLEDGE_BOOK`` material"
	"nbt", |t_obj|, |ex_below| :ref:`prop-nbt`, "Add NBT tags to the item"
	"**Special properties**"
	"bindings", |t_list_obj|, |ex_below| :ref:`struct-bindings`, "Binds some properties to rules. If player matches specified rules, then these properties will be applied to item"

.. note:: Material installer is a property that set the item's material and optionally other parameters. You should use only one material installer property for an item.

.. _prop-slot:

Slot
----

The item's slot is the cell in the inventory (of the menu or player's) where the item will be placed. The slot can be specified in several ways:

Way 1. X, Y coordinates
~~~~~~~~~~~~~~~~~~~~~~~

::

	slot: "4,3" // x,y

In this example, ``x`` and ``y`` means the horizontal and vertical position of the item, respectively. The countdown starts from 1. The image below can be useful to understanding this.

.. figure:: ../_static/items_slots_xy.png
	:align: center

	How XY slots works

Way 2. Index
~~~~~~~~~~~~

::

	slot: 0

You can specify slot just by a real index. To find out the number of the desired slot, you can use this cheat sheet:

.. figure:: ../_static/items_slots_id.png
	:align: center

	Slots indexes

Way 3. Range
~~~~~~~~~~~~

::

	slot: "0-6"

To place one item inside several slots, you can use ranged slots format. An item with slot above will be placed in cells with index 0, 1, ..., 6.
This format can be useful to fill menu with some background item without manual putting them in every slot.

Way 4. Matrix
~~~~~~~~~~~~~

::

	items: [
	  {
	    slot: [
	      "xxxxxxxxx",
	      "x-------x",
	      "x-------x",
	      "x-------x",
	      "x-------x",
	      "xxxxxxxxx"
	    ]
	    material: BLACK_STAINED_GLASS_PANE
	  }
	]

If you need more complex positioning, you can specify slot as cells matrix. For example, you need set a border for your menu. You can make something like above. Then this will look like this:

.. figure:: ../_static/items_slots_matrix_1.png
	:align: center

	Result of using cells matrix

Every char of this matrix is a some slot.

Char ``-`` is always empty slot.
Char ``x`` represents slots which will be filled with current item. You can specify any other char except ``-``.

The size of matrix may be equal or less than size of menu. This mean, you can specify slot like that with the same size of menu:

::

	slot: [
	  "xxx",
	  "x-x",
	  "xxx"
	]

And menu will looks like this:

.. figure:: ../_static/items_slots_matrix_2.png
	:align: center

	Result of using lesser cells matrix

.. note:: The slots counting in cells matrix always starts from top-left.

.. attention:: Items placed by ranged slots and cells matrix doesn't cloning. This mean that if you change property of some item, changes will apply to other items placed by this slot. So you shouldn't use this slot format for unique items.

.. _prop-skull-owner:

Skull Owner
-----------

This property can be used to get player's head. It takes player name as argument. For example:

::

	skullOwner: "Notch"

If you need to get head of player who opened menu, use placeholder to get player name first:

::

	skullOwner: "%player_name%"

.. important:: AbstratMenus loads player's skin on join to server. If you use name of player who is not joined to server, plugin will try to load skin data before menu will be opened. If you use static names in skullOwner, more suitable way is to use ``texture`` property.

.. note:: If some skin data cannot be loaded (for example, if player don't have skin), head will be empty (Steve or Alex).

.. _prop-texture:

Texture
-------

You can specify texture using one of the following formats.

Texture URL
~~~~~~~~~~~

Direct link to the texture image. Example:

::

	texture: "https://textures.minecraft.net/texture/a45d68aea87cc3fd20b96b21e18255db298b2eac986526473116bd3b5750b787"

Texture Hash
~~~~~~~~~~~~

Texture hash is a sha-1 hash of skin image. 
This hash you can find in the end of each texture url, avoiding static ``https://textures.minecraft.net/texture/`` prefix. 
Example:

::

	texture: "a45d68aea87cc3fd20b96b21e18255db298b2eac986526473116bd3b5750b787"

Using this way, the plugin will add the static prefix and a final url will be ``https://textures.minecraft.net/texture/a45d68aea87cc3fd20b96b21e18255db298b2eac986526473116bd3b5750b787``

Base64 encoded
~~~~~~~~~~~~~~

Also often called "Texture value". 
This is a url to texture, included in JSON and encoded using Base64 encoder.
You can use such value with ``base64:`` prefix. Example:

::

	texture: "base64:eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvYTQ1ZDY4YWVhODdjYzNmZDIwYjk2YjIxZTE4MjU1ZGIyOThiMmVhYzk4NjUyNjQ3MzExNmJkM2I1NzUwYjc4NyJ9fX0="

.. _prop-equip-item:

Equiped Item
------------

Item property to get item from player's inventory. By default it takes item from inventory of player who opened menu. Example:

::

	equipItem: HEAD

.. tip:: All slot types you can find `here <https://hub.spigotmc.org/javadocs/spigot/org/bukkit/inventory/EquipmentSlot.html>`_

But you also can take item from another player's inventory. For this you need to transform this property to object and set player name. Placeholders are supported. Example:

::

	equipItem {
	  player: "%player_name_placeholder%"
	  slot: HEAD
	}

.. _prop-serialized:

Deserialize from base64 string
------------------------------

The ``serialized`` item property allow to deserialize item from base64 string. Such string usually can be retrieved using :ref:`extractor-item` placeholder, for example, when you use drag-and-drop feature. Example:

::

	{
	  slot: 0
	  serialized: "%moved_item_serialized%" // Placehodler returns base64 string
	  name: "New item name"
	  lore: "New item lore"
	}

If add other item properties, like ``name`` they will replace present properties from deserialized item.

.. note:: If you save such string into variable and then use it after server update or downgrade, item may be not compatible with different server version.

.. _prop-lore:

Lore
----

The lore is a :ref:`list of strings <hocon-list-str>`. Each new line in the list is a line in the item's lore. For example:

::

	lore: [
	  "Line 1",
	  "Line 2",
	  "Line 3"
	]

.. _prop-ench:

Enchantments
------------

Enchantments has format ``<enchantment>: <level>`` where:

:<enchantment>: Bukkit's enchantment name. You can find it `here <https://hub.spigotmc.org/javadocs/spigot/org/bukkit/enchantments/Enchantment.html>`_
:<level>: Level of the enchantment. Minimal level is ``1``.

Example:

::

	enchantments {
	  DAMAGE_ALL: 1
	  DURABILITY: 2
	}


.. _prop-color:

Color
-----

Color used to paint items that support it, such as leather armor or potion. Color can be specified in one of 3 ways. In the examples, we will show a way to specify white color.

Way 1. RGB
~~~~~~~~~~

RGB values (0-255) separated by comma.

::

	color: "255,255,255" // r,g,b

Way 1. Spigot color name
~~~~~~~~~~~~~~~~~~~~~~~~~~

Use a native Spigot color names.

::

	color: WHITE

.. seealso:: You can find list of colors `here <https://hub.spigotmc.org/javadocs/bukkit/org/bukkit/Color.html>`_

Way 1. HEX
~~~~~~~~~~

Hexadecimal format like in CSS.

::

	color: "#FFFFFF"

.. note:: Colors can be used only for painting leather armor, potions and other materials that supports it.

.. _prop-flags:

Flag
----

Flags are used to add new properties to item. The list of flags is a :ref:`strings list <hocon-list-str>` like ``lore``. For example:

::

	flags: [
	  "HIDE_UNBREAKABLE",
	  "HIDE_ENCHANTS",
	]

Or if there is only flag:

::

	flags: "HIDE_ATTRIBUTES"

Spigot currently has the following flags:

:HIDE_ATTRIBUTES: Hide item attributes such as damage.
:HIDE_DESTROYS: Hide the information about item durability.
:HIDE_ENCHANTS: Hide item enchantments.
:HIDE_PLACED_ON: Hide information that an item can be built/placed on something like this.
:HIDE_POTION_EFFECTS: Hide potion effects :D.
:HIDE_UNBREAKABLE: Hide the ``unbreakable`` label.

.. note:: A flags for each Spigot versions might be different or missing. Check flags for your version only on `this <https://hub.spigotmc.org/javadocs/bukkit/org/bukkit/inventory/ItemFlag.html>`_ or similar pages. Do not trust the list above for 100%.

.. _prop-potion:

Potion effect
-------------

This property is a :ref:`list of objects <hocon-list-obj>` containing effects of the potion. Each item in the list is a potion effect. Example:

::

	potionData: [
	  {
	    effectType: FAST_DIGGING
	    duration: 100
	    amplifier: 1
	  },
	  {
	    effectType: SPEED
	    duration: 100
	    amplifier: 2
	  }
	]

Each potion effect has 3 required parameters:

:effectType: Potion effect type. All types can be found `here <https://hub.spigotmc.org/javadocs/spigot/org/bukkit/potion/PotionEffectType.html>`_.
:duration: Potion effect duration in ticks (1 second = 20 ticks).
:amplifier: Power (level) of the effect.

.. note:: The ``potionData`` property can be used only if item's material supports this.

.. _prop-firework:

Firework
--------

To create a colored firework, use ``fireworkData`` property. Example:

::

	fireworkData {
	  power: 2
	  effects: [
	    {
	      type: BALL
	      trail: false
	      colors: [
	        "#FFFFFF",
	        "#FF0000"
	      ]
	      fadeColors: [
	        "#000000",
	        "#00FF00"
	      ]
	    }
	  ]
	}

The ``power`` parameter set the lifetime of firework. This is optional parameter. By default its ``1``.

The ``effects`` parameter is a :ref:`list of objects <hocon-list-obj>`. Each object is a firework effect and has several parameters:

:type: Type of the shape when firework explodes. You can find all firework types `here <https://hub.spigotmc.org/javadocs/bukkit/org/bukkit/FireworkEffect.Type.html>`_.
:trail: Is firework has trail while launched.
:colors: List of colors when firework's explode start.
:fadeColors: List of colors when firework's explode fade.

You can add several objects in ``fireworkData`` property. Then it will explode with all specified effects.

.. note:: This property will only work if the material of the item is ``FIREWORK_ROCKET`` (or ``FIREWORK`` on Spigot ``1.12`` and lower).

.. _prop-book:

Book
----

This property can be used to create a written book with pages. Example:

::

	bookData {
	  author: "Peter Piper"
	  title: "&e&lTitle"
	  pages: [
	    "First page content",
	    "Second page content"
	  ]
	}

This property has several parameters:

:author: The book's author which will be displayed.
:title: The displayed book's title.
:pages: The :ref:`list of strings <hocon-list-str>`. Each new line is a new page content.

.. note:: The ``bookData`` property will only work for ``WRITTEN_BOOK`` material.

.. _prop-banner:

Banner
------

To create a decorated banner, use the ``bannerData`` property. There are two ways to use it:

Way 1. NBT
~~~~~~~~~~

You can generate a banner in any banner designer, for example in `this <https://www.planetminecraft.com/banner/>`_, and paste the result NBT as a string parameter. Example:

::

	bannerData: "{BlockEntityTag: {Base: 12, Patterns: [{Pattern: hh, Color: 6}, {Pattern: vh, Color: 6}, {Pattern: lud, Color: 7}, {Pattern: tts, Color : 6}, {Pattern: vh, Color: 14}, {Pattern: cre, Color: 2}]}}"

Way 2. HOCON
~~~~~~~~~~~~

A more complicated, but affordable way is to specify patterns as :ref:`list of objects <hocon-list-obj>`. Example:

::

	bannerData: [
	  {
	    type: BASE
	    color: WHITE
	  },
	  {
	    type: MOJANG
	    color: RED
	  }
	]

Each element of this list is a banner's pattern. Each pattern has this parameters:

:type: Type of the pattern. You can find all pattern types `here <https://hub.spigotmc.org/javadocs/spigot/org/bukkit/block/banner/PatternType.html>`_.
:color: Color of the pattern. Spigot supports only named colors for banners.

.. _prop-nbt:

NBT tags
--------

.. attention:: To use this property, you need to install `NBT_API <https://spigotmc.org/resources/7939>`_ plugin first.

Using NBT, you can add properties for items that has not yet been added to the plugin. NBT tags can be specified here using HOCON or a regular string. For example, you can add a name to an item via NBT tag. Example:

::

	{
	  slot: 0
	  material: IRON_PICKAXE
	  nbt {
	    display {
	      Name: "&aMy pickaxe"
	    }
	  }
	}

.. important:: Placeholders won't work inside NBT tags. This is for optimization purposes, to avoid parsing all string types inside the tag while the plugin is running.

Inside the ``nbt`` property, you can write any HOCON constructs, and the plugin converts them to NBT tags on startup. Please note that many NBT tags differ on different versions of Minecraft. So, if some tag does not work, most likely you specified it wrong.
One more example. Let's add two enchantments to the item:

::

	{
	  slot: 0
	  material: IRON_PICKAXE
	  nbt {
	    display {
	      Name: "My pickaxe"
	    }
	    ench: [
	      {
	        id: 34
	        lvl: 2
	      },
	      {
	        id: 35
	        lvl: 3
	      }
	    ]
	  }
	}

The ``ench`` parameter is a :ref:`list of objects <hocon-list-obj>`. The types and names of tags must exactly match those that must be in the final NBT.

Of course, you can add your own custom tags:

::

	nbt {
	  mytag1: "mytag"
	  mytag2: 15
	  mytag3 {
	    mytag1: "hello"
	  }
	}

Those tags will be added to the item. To check them you can use special plugins or mods.