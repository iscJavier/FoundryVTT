# Some macros and rule elements for [Pathfinder 2](https://github.com/foundryvtt/pf2e) on [FoundryVTT](https://foundryvtt.com/) .

Tested on FoundryVTT 11-305 and pf2e 5.1.2  
Simply copy-paste from `/dist`.

## Rule Elements

- #### dex-damage

  Adds DEX mod on damage rolls for `ranged` or `finesse` weapons.

## Macros

### Alchemical Crossbow

These macros handle [Alchemical Crossbow](https://2e.aonprd.com/Weapons.aspx?ID=118)'s action to expend a `Lesser Alchemical Bomb` to enhance its damage.

- #### infuse-alchemical-crossbow

  Expend 1 `Lesser Alchemical Bomb` on inventory to add 1d6 of its damage type on the next 3 shots.

- #### remaining-alchemical-crossbow

  Tells you how many infused shots remain on the `Alchemical Crossbow`.

- #### alchemical-crossbow-attack

  Attacks must be made with this macro to handle infused shots counter.

### Chronoskimmer

- #### roll-chrono-initiative

  Prompts for [Chronoskimmer Dedication](https://2e.aonprd.com/Feats.aspx?ID=3847) option and rolls initiative accordingly
