.. include:: ../_includes/datatypes.rst

.. |ex_below| replace:: See example

Rules
=====

.. include:: ../_includes/contents.rst

A rule is a check before performing some actions. The result of this check influences what actions will be performed.

Rules has simple format. Example:

::

	rules {
	  permission: "some.perm"
	}

You can specify one or several rules, similar to activators and actions. Every new rule must be on the new line. For example:

::

	rules {
	  permission: "some.perm"
	  group: "default"
	  money: 3000
	}

In this example, we check a player for permission "some.perm", a group "default" and money amount in 3000. All next actions will be executed only if player matches all of these rules.

All rules
---------

.. csv-table::
	:header: "Name", "Data type", "Example", "Description"
	:widths: 5, 5, 10, 30

	"permission", |t_list_str|, ``permission: "some.perm"``, "Does the player has a permission"
	"world", |t_str|, ``world: "world"``, "Does the player in specified world"
	"gamemode", |t_str|, ``gamemode: SURVIVAL``, "Compare player's gamemode with specified"
	"group", |t_list_str|, ``group: "default"``, "Does the player is a member of all of specified **LuckPerms** groups"
	"money", |t_int|, ``money: 2``, "Does the player has enough money. **Vault** required"
	"level", |t_int|, ``level: 1``, "Does the player has required level"
	"xp", |t_int|, ``xp: 20``, "Does the player has required XP"
	"health", |t_int|, ``health: 15``, "Does the player has required HP"
	"foodLevel", |t_int|, ``foodLevel: 5``, "Does the player has required food level"
	"chance", |t_int|, ``chance: 50``, "A random chance to complete this rule in percentages"
	"online", |t_int|, ``online: 17``, "Is there required players count on the server"
	"playerIsOnline", |t_str|, ``playerIsOnline: "Notch"``, "Chck is required player on the server"
	"inventoryItems", |t_list_obj|, |ex_below| :ref:`rule-items`, "Does player has a items, specified in the list"
	"heldItem", |t_obj|, |ex_below| :ref:`rule-held`, "Does the item in the player's main hand match the specified item"
	"freeSlot", |t_int|, ``freeSlot: -1`` ``freeSlot: 3``, "Checks player inventory for free slot. If number is greater that ``-1`` it will check specified slot. If number lesser than ``0`` it will check inventory for any free slot"
	"freeSlotCount", |t_int|, ``freeSlotCount: 2``, "Checks player inventory for specify free slots count. If player has a same or more free slots it will return true"
	"existVar", "|t_str|, |t_obj|", |ex_below| :ref:`rule-var`, "Check is there exists global variable"
	"existVarp", |t_str|, |ex_below| :ref:`rule-var`, "Check is there exists personal variable"
	"placedItem", |t_obj|, |ex_below| :ref:`rule-placed-item`, "For drag-and-drop. Check is there placed some item in menu by player"
	"**WorldGuard**"
	"region", |t_list_str|, ``region: "myregion"``, "Checks player is in one of the specified **WorldGuard** regions"
	"**BungeeCord**"
	"bungeeOnline", |t_obj|, |ex_below| :ref:`rule-bungee`, "Does bungee server has enough players count"
	"bungeeIsOnline", |t_str|, ``bungeeIsOnline: "lobby"``, "Checks the specified **BunegeCord** server is online"
	"**Complex rules**"
	"if", |t_list_obj|, |ex_below| :ref:`rule-if`, "Checks some text and numeric parameters"
	"js", |t_str|, |ex_below| :ref:`rule-js`, "Execute JavaScript script and check the result"
	"**Special rules**"
	"and", |t_list_obj|, |ex_below| :ref:`here <logical-and>`, "Logical wrapper for rules implemented with 'AND' operator"
	"or", |t_list_obj|, |ex_below| :ref:`here <logical-or>`, "Logical wrapper for rules implemented with 'OR' operator"
	"oneof", |t_list_obj|, |ex_below| :ref:`here <logical-oneof>`, "Works as ``and`` wrapper but will be stopped if some rule in the list will be ``true``"
	"playerScope", |t_obj|, |ex_below| :ref:`here <rule-player-scope>`, "Rules wrapper to check another player found by name"

.. _rule-items:

Inventory items
---------------

Rule to check player's inventory for some items. This is an :ref:`objects list <hocon-list-obj>`, where each object is an item. Items has same format as anywhere in AM. Example:

::

	inventoryItems: [
	  {
	    material: CAKE
	    amount: 5
	  },
	  {
	    material: STONE
	    amount: 2
	  }
	]

You can also use it as a single object. Example:

::

	inventoryItems {
	  material: CAKE
	  amount: 5
	}

If you add ``slot`` parameter, this rule will check item in specified slot or slots:

::

	inventoryItems {
	  slot: 0
	  material: CAKE
	  amount: 5
	}

The rule above will be ``true`` for player if it has at least 5 cakes in slot 0.
You can also use other slot formats, for example:

::

	inventoryItems {
	  slot: "0-8"
	  material: CAKE
	  amount: 5
	}

The rule above will be ``true`` for player if it has at least 5 cakes in each slot ``0, 1, 2, ..., 8``

.. _rule-held:

Held item
---------

Rule to check a held item.

::

	heldItem {
	  material: CAKE
	  amount: 5
	}

.. _rule-var:

Var existing
------------

Rules to check is there exists some variable.

For global variables:

::

	existVar: "global_var_name"

For personal variables:

::

	existVarp: "personal_var_name"

Rule ``existVar`` also has legacy format. It can be specified as object with variable 
name and optional name of player - variable owner.

::

	existVar {
	  player: "Peter" // Specify only if variable is personal. Optional parameter
	  name: "name" // Name of the variable. Required parameter.
	}

:name: Variable name.
:player: **[Optional]** Specify if you need to check personal variable.

However, we recommend you to use brief format of ``existVar`` rule where this possible.

.. _rule-bungee:

BungeeCord online
-----------------

.. note:: Make sure you enabled ``bungeecord`` in plugin config. If not, this rule will not work.

Rule to check players count on some BungeeCord server. Example:

::

	bungeeOnline {
	  server: "lobby"
	  online: 20
	}

:server: BungeeCord server name.
:online: Required players count.

.. _rule-if:

"If" rule
---------

Rule to compare some data (for example, placeholder from PAPI) with another data.

Since AbstarctMenus v1.13 ``if`` rule has two formats: modern and legacy (deprecated).

Modern "If" format
~~~~~~~~~~~~~~~~~~

.. |example_or| replace:: ``%player_level% > 5 || %player_name% == Notch``

This format similar to ``js`` rule. But unlike ``js``, modern ``if`` works much faster, around 8-10 times. Example:

::

	if: "%player_name% == Notch"

Here we compare placeholder with some value. Modern ``if`` has no math expressions, only logical. Below are all logical operators which you can use for your expressions.

.. csv-table::
	:header: "Operator", "Example", "Means", "Priority"
	:widths: 5, 10, 20, 1

	">", ``%player_level% > 5``, "More", "3"
	"<", ``%player_level% < 8``, "Less", "3"
	">=", ``%player_level% >= 5``, "More or equals", "3"
	"<=", ``%player_level% <= 8``, "More or equals", "3"
	"==", ``%player_level% == 9``, "Equals", "2"
	"!=", ``%player_level% != 9``, "Not equals", "2"
	"===", ``%player_name% === nOtCh``, "Equals ignore case", "2"
	"!==", ``%player_name% !== nOtCh``, "Not equals ignore case", "2"
	"&&", ``%player_level% > 5 && %player_name% == Notch``, "And", "1"
	"||", |example_or|, "Or", "0"

Unlike ``js`` rule, inside ``if`` you don't need to use quotes (``''``, ``""``) to define strings. There are also logical brackets ``()`` to define logical groups and increase priority of some operations. Example:

::

	if: "(%player_lvl% == 5 || %player_lvl% == 10) && (%player_name% == Notch || %player_name% == Nanit)"

This expression will return true if player has level 5 or 10 AND if has username "Notch" or "Nanit".

If you need math operations or more complex conditions, then you can use ``js`` rule. But if not, we recommend use modern ``if`` rule to speed up you menus.

Legacy "If" format
~~~~~~~~~~~~~~~~~~

.. warning:: We don't recommend use this format since modern ``if`` more brief, uderstandable and has more abilities to build complex logical expressions.

Example:

::

	if {
	  param: "%player_name%"
	  equals: [
	    "Notch",
	    "DeadMouse"
	  ]
	  equalsIgnoreCase: [
	    "notch",
	    "deadmouse"
	  ]
	  contains: [
	    "dead",
	    "tch"
	  ]
	  less: 6
	  more: 2
	}

Parameter ``param`` is required. All other are optional.

:param: The parameter which you compare (``%player_name%`` is a placeholder which replaces to player name who opened menu).
:equals: Check parameter with list of strings. **Case sensitivity**.
:equalsIgnoreCase: Check parameter with list of strings. **Case insensitivity**
:contains: Check parameter to contains one of the specified substring.
:less: Does the parameter less than the specified number. For numeric parameters only.
:more: Does the parameter greater than the specified number For numeric parameters only.

.. _rule-js:

JavaScript
----------

.. important:: JavaScript engine was removed from official JVM since Java 15. To continue using ``js`` rule, plugin loads this engine at server startup. This possible only for Spigot 1.16.5 and higher. If you use Java 15+ with Spigot less than 1.16.5, the ``js`` rule won't work.

The plugin allows you to use JavaScript code. Code inside must always return the result - ``true`` or ``false``. If the code returns something else, the plugin will suppose this is a ``false``. This rule can be used as a replacement for the ``if`` rule because of its greater versatility. But you should understand that interpreting JavaScript will take longer than the ``if`` rule.

The ``js`` rule supports placeholders. This will allow you to compare them, and manipulate them using JavaScript syntax. Example:

::

	rules {
	  js: "'%player_name%'.length < 5"
	}

.. _rule-player-scope:

Player scope rules
------------------

If you need to check another player, you can use special rules wrapper called ``playerScope``. Example with item display rules:

::

	{
	  slot: 0
	  material: cake
	  rules {
	    playerScope {
	      name: "%player_name_placeholder%"
	      rules {
	        permission: "perm.name"
	      }
	    }
	  }
	}


The rules inside ``rules`` block will be executed for player who found by name, entered in ``name`` field. In our case, item will be shown if player found by placeholder has ``perm.name`` permission.

.. note:: If player not found, this rule just will return false, without throwing error.