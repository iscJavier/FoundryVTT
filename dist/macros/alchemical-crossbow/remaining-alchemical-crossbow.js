(async () => {
    const character = game.user.character;
    if (!character) {
        return ui.notifications.error("You don't have a Character.");
    }
    const inventory = character.inventory;
    const xbow = inventory.contents.find((item) => item.system.baseItem === 'alchemical-crossbow');
    if (!xbow) {
        return ui.notifications.error("You don't have an Alchemical Crossbow.");
    }
    const infusedXbowShots = xbow.flags.pf2e.iscJavierAlchemicalCrossbow?.shots;
    if (!infusedXbowShots) {
        xbow.update({
            'system.property1': { ...xbow.system.property1, damageType: '', dice: null, die: '', value: '' },
        });
    }
    const content = infusedXbowShots
        ? `<strong>${infusedXbowShots} ${xbow.system.property1.damageType}</strong> infused shots remaining on Alchemical Crossbow.`
        : 'Alchemical Crossbow has <strong>no remaining</strong> infused shots';
    ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({ token: actor }),
        content,
    });
})();
