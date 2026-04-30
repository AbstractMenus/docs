---
title: Placeholders
description: "Placeholder is a part of text concluded between `%` chars."
---

<div class="audience-tags"><span class="audience-tag audience-author">Menu author</span></div>

Placeholder is a part of text concluded between `%` chars.

The plugin supports placeholders in any parameter of the item, action, rule and in some activators. It doesn’t matter what data type the parameter accepts.

If the parameter accepts a number, and a placeholder inserted instead of it also returns a number, this will work. Therefore, if you use placeholders for numeric types, make sure that it is replaced with a number, otherwise, there will be an error.

There are default built in AM and third-party (PlaceholderAPI) placeholders.

## Built-in placeholders

| Placeholder                                | Type                 | Description                                                              |
|--------------------------------------------|----------------------|--------------------------------------------------------------------------|
| **Player placeholders**                    |                      |                                                                          |
| %player_name%                              | String               | Player name                                                              |
| %player_display_name%                      | String               | Display name (with colors)                                               |
| %player_level%                             | Number               | Player level                                                             |
| %player_xp%                                | Number               | Player XP                                                                |
| %player_location%                          | String               | Player location                                                          |
| %player_world%                             | String               | Player world                                                             |
| %player_uuid%                              | String               | UUID of player                                                           |
| %player_gm%                                | String               | Bukkit's gamemode name                                                   |
| **Server placeholders**                    |                      |                                                                          |
| %server_players%                           | Number               | Amount of players                                                        |
| %server_players\_\<world\>%                | Number               | Amount of players in specified world                                     |
| %server_name%                              | String               | Name of server                                                           |
| %server_ip%                                | String               | IP address of server                                                     |
| %server_port%                              | Number               | Server port                                                              |
| %server_max_players%                       | String               | Max players slots                                                        |
| %server_version%                           | String               | Version of server                                                        |
| **BungeeCord placeholders**                |                      |                                                                          |
| %bungee_online%                            | Number               | The total count of players on all BungeeCord network                     |
| %bungee_players\_\<server\>%               | Number               | Count of players on a specific BungeeCord servers                        |
| **Special placeholders**                   |                      |                                                                          |
| %hanim_:\<animation_name\>:\<unique_id\>% | String               | Returns next frame of the head animation from `animated_heads.conf` file |
| %ctg_page%                                 | Number               | Current page index                                                       |
| %ctg_pages%                                | Number               | Total amount of menu pages                                               |
| %ctg_page_next%                            | Number               | Next page index                                                          |
| %ctg_page_prev%                            | Number               | Previous page index                                                      |
| %ctg_elements%                             | Number               | Total amount of catalog objects                                          |
| %ctg\_\<extractor placeholder\>%           | Depends on Extractor | Get value by some extractor from Catalog context                         |
| %activator_name%                           | String               | Name of activator which opened menu                                      |
| %activator\_\<extractor placeholder\>%     | Depends on Extractor | Get value by some extractor from Activator context                       |
| %placed\_\<item_extractor_placeholder\>%   | Depends on Extractor | Get info about last placed item                                          |
| %placed_slot%                              | Number               | Get slot index in which last item was placed                             |
| %taken\_\<item_extractor_placeholder\>%    | Depends on Extractor | Get info about last taken item                                           |
| %taken_slot%                               | Number               | Get slot index from which last item was taken                            |
| %changed\_\<item_extractor_placeholder\>%  | Depends on Extractor | Get info about final item after placing/taking                           |

If you have installed [PlaceholderAPI](https://www.spigotmc.org/resources/6245/), some of this placeholder won't work and will be replaced by big variety of placeholders from third party plugin instead. **Special placeholders** always works both with PAPI and without it.

## Example of using placeholders

Below is some examples of using placeholders in menu.

### In commands

```hocon
command {
  console: "give %player_name% minecraft:diamond_sword"
}
```

### In items

```hocon
itemAdd {
  slot: 0
  material: STONE
  name: "&e%player_name% stone"
}
```

## Placeholders for variables

There are more placeholders to discover, e.g. [placeholders for variables](/docs/en/general/variables/#access-to-variables) to read a variable value. You can use them whether you've installed PlaceholderAPI or not.

## Value extractors

:::caution
Value Extractors **are not independent placeholders** like `%player_name%`. They can be used only in some context, e.g. the activator context or inside generated menus.
:::

Sometimes AbstractMenus saves some context data. For example, when a player opens a menu via `clickBlock`, the plugin saves the block the player clicked. Activator placeholders give you access to that context. This is possible thanks to Value Extractors. To know how to use extractors as placeholders, see the [Activator context](/docs/en/advanced/input/#activator-context) article.

For each data exists own extractor that can accept limited amount of placeholders. Below described all extractors and placeholder which they can accept.

### Block extractor

Get data from Minecraft's block.

| Name        | Note                                   |
|-------------|----------------------------------------|
| block_type  | Block material                         |
| block_data  | Block data (MC 1.12-)                  |
| block_world | Block world                            |
| block_x     | Position by X axis                     |
| block_y     | Position by Y axis                     |
| block_z     | Position by Z axis                     |
| block_power | Redstone block power                   |
| block_temp  | Temperature of the biome of this block |
| block_biome | Name of biome of this block            |

### World extractor

Get data from some world.

| Name             | Note                                                                |
|------------------|---------------------------------------------------------------------|
| world_name       | Name of the world                                                   |
| world_difficulty | World difficulty (peaceful, normal, etc.)                           |
| world_max_height | Max height of building                                              |
| world_pvp        | Is PVP allowed                                                      |
| world_seed       | Seed value of world                                                 |
| world_time       | The relative in-game time of this world. Analogous to hours \* 1000 |
| world_type       | World type name (default, flat, etc.)                               |
| world_entities   | Amount of entities (include players) in world                       |
| world_players    | Amount of players in world                                          |

### Entity extractor

Get data from some entity. If you sure that this entity is Living entity (animal, monster, player, etc.), you can use placeholders for living entities.

:::note
If you sure, that entity is a Player, you can use any placeholder (PAPI or bundled) instead of placeholders described below. Then this placeholder will be replaced for player which Entity Extractor handles.
:::

| Name                   | Note                                  |
|------------------------|---------------------------------------|
| **All entities**       |                                       |
| entity_type            | Type name                             |
| entity_id              | Numeric id                            |
| entity_uuid            | Unique id                             |
| entity_name            | General name                          |
| entity_custom_name     | Custom name (if exists)               |
| entity_world           | Entity world name                     |
| entity_loc_x           | Position by X axis                    |
| entity_loc_y           | Position by Y axis                    |
| entity_loc_z           | Position by Z axis                    |
| entity_facing          | Entity facing (north, east, etc.)     |
| entity_pose            | Entity pose (MC 1.14+)                |
| entity_ticks_lived     | How much entity lives                 |
| **Living entity**      |                                       |
| entity_last_damage     | Last damage value                     |
| entity_no_damage_ticks | How long the entity has existed without damage |
| entity_killer          | Last killer name (if exists)          |
| entity_eye_height      | Eye height value                      |

### Item extractor

Get data from ItemStack.

| Name                | Note                                                                                                       |
|---------------------|------------------------------------------------------------------------------------------------------------|
| item_type           | Item material                                                                                              |
| item_data           | Item data (MC 1.12-)                                                                                       |
| item_amount         | Amount in stack                                                                                            |
| item_max_stack      | Max possible stack size                                                                                    |
| item_display_name   | Formatted name                                                                                             |
| item_localized_name | Localized name                                                                                             |
| item_model          | Custom model data (MC 1.14+)                                                                               |
| item_serialized     | The whole item serialized into base64 string. Can be used with [serialized](/docs/en/general/item-format/#deserialize-from-base64-string) item property |

### Region extractor

Get data from WorldGuard region.

| Name                  | Note                               |
|-----------------------|------------------------------------|
| region_id             | Region name                        |
| region_priority       | Region priority                    |
| region_type           | Region type (cuboid, poly2d, etc.) |
| region_owners         | List of owners                     |
| region_members        | List of members                    |
| region_owners_amount  | Amount of owners                   |
| region_members_amount | Amount of members                  |

### NPC extractor

Get data from Citizens NPC.

| Name                                 | Note                                                  |
|--------------------------------------|-------------------------------------------------------|
| npc_id                               | Numeric NPC id                                        |
| npc_name                             | General name                                          |
| npc_full_name                        | Full name                                             |
| npc_entity\_\<entity placeholder\> | Get value from NPC's entity by Entity Value extractor |

For example, you need to get NPC's entity type. According to the [Entity extractor format](#entity-extractor), your placeholder will look like this:

    npc_entity_type

The only difference is an `npc_` prefix.

### Command extractor

Get data from parsed command (currently used by activators only).

| Name                             | Note                                                             |
|----------------------------------|------------------------------------------------------------------|
| cmd_name                         | Base name of the command                                         |
| cmd_args                         | Amount of arguments                                              |
| cmd_arg:\<argument key\>          | Value of parsed argument by key                                  |
| \<argument key\>:\<placeholder\> | Get value with regular placeholder by player, entered in command |

For example, you specified argument with key `username` by some activator. Then, to get value which user entered, you need to use placeholder like this:

    cmd_arg_username

More about command building and reading arguments is in the [Commands building](/docs/en/advanced/input/#commands-building) section.
