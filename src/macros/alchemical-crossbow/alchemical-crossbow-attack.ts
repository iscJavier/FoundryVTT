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
  const xbowActions = character.system.actions.find((action) => action.slug === xbow.slug);
  if (!xbowActions) {
    return ui.notifications.error("Couldn't find Alchemical Crossbow actions.");
  }

  const showDialog = <T>(title: string, content: string, selectId: string, arr: Array<T>): Promise<T | undefined> =>
    new Promise((resolve) => {
      new Dialog({
        title,
        content,
        buttons: {
          ok: {
            label: 'OK',
            callback: (html) => {
              const index = html.find(selectId)[0].value;
              resolve(arr[index]);
            },
          },
          cancel: {
            label: 'Cancel',
            callback: () => resolve(undefined),
          },
        },
      }).render(true);
    });

  const infusedXbowShots = xbow.flags.pf2e.iscJavierAlchemicalCrossbow?.shots;
  if (!infusedXbowShots) {
    xbow.system.property1 = { ...xbow.system.property1, damageType: '', dice: null, die: '', value: '' };
  }

  const contentVariantOptions = xbowActions.variants.map((variant, index) => `<option value=${index}>${variant.label}</option>`);
  const infusedXbowLabel = infusedXbowShots
    ? `Alchemical Crossbow infused with <strong>${xbow.system.property1.damageType}</strong>`
    : 'Uninfused Alchemical Crossbow';
  const contentVariantSelection = [
    '<span style="display:flex;flex-direction:column;justify-content:center;">',
    `<span>${infusedXbowLabel}</span>`,
    '<h3>Attack with:</h3>',
    `<select id="selected-variant">${contentVariantOptions}</select>`,
    '<span>&nbsp;</span>',
    '</span>',
  ].join('');
  const selectedVariant = await showDialog(
    'Alchemical Crossbow Attack',
    contentVariantSelection,
    '#selected-variant',
    xbowActions.variants
  );
  if (selectedVariant === undefined) {
    return;
  }
  const rollResult = await selectedVariant.roll();
  if (rollResult) {
    let remainingShots = 0;
    if (infusedXbowShots) {
      remainingShots = xbow.flags.pf2e.iscJavierAlchemicalCrossbow!.shots - 1;
      xbow.update({
        'flags.pf2e': { ...xbow.flags.pf2e, iscJavierAlchemicalCrossbow: { shots: remainingShots } },
      });
    }
    // not reseting xbow.system.property1 immediately to workaournd not being able to wait for damage roll
    const content = remainingShots
      ? `<strong>${remainingShots} ${xbow.system.property1.damageType}</strong> infused shots remaining on Alchemical Crossbow.`
      : 'Alchemical Crossbow has <strong>no remaining</strong> infused shots';
    ChatMessage.create({
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ token: actor }),
      content,
    });
  }
})();
