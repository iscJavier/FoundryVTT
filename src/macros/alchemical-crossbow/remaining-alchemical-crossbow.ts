(async () => {
  const actor = game.user.character;
  if (!actor) {
    return ui.notifications.error("You don't have a Character.");
  }
  const token = actor.getActiveTokens().pop();
  if (!token) {
    return ui.notifications.error(game.i18n.format('PF2E.Encounter.NoTokenInScene', { actor: actor.name }));
  }
  const inventory = actor.inventory;
  const xbow = inventory.contents.find((item) => item.system.baseItem === 'alchemical-crossbow');
  if (!xbow) {
    return ui.notifications.error("You don't have an Alchemical Crossbow.");
  }

  const infusedXbowShots = xbow.flags.iscJavierAlchemicalCrossbow?.shots;
  if (!infusedXbowShots) {
    xbow.update({
      'system.property1': { ...xbow.system.property1, damageType: '', dice: null, die: '', value: '' },
    });
  }

  const content = infusedXbowShots
    ? `<strong>${infusedXbowShots} ${xbow.system.property1.damageType}</strong> infused shots remaining on Alchemical Crossbow.`
    : 'Alchemical Crossbow has <strong>no remaining</strong> infused shots';
  await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ token, actor }),
    content,
  });
})();
