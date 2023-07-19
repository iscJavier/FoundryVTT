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
    const whitelist = ['acid-flask-lesser', 'alchemists-fire-lesser', 'bottled-lightning-lesser', 'frost-vial-lesser', 'thunderstone-lesser'];
    const bombs = inventory.contents.filter((item) => whitelist.includes(item.slug));
    if (bombs.length === 0) {
        return ui.notifications.error("You don't have any lesser alchemical bombs.");
    }
    const showDialog = (title, content, selectId, arr) => new Promise((resolve) => {
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
    const contentBombsOptions = bombs.map((bomb, index) => `<option value=${index}>${bomb.name}; <strong>${bomb.system.damage.damageType} damage</strong>; ${bomb.quantity} in inventory.</option>`);
    const contentBombSelection = [
        '<span style="display:flex;flex-direction:column;justify-content:center;">',
        '<h3>Select a bomb for the infusion.</h3>',
        `<select id="selected-bomb">${contentBombsOptions}</select>`,
        '<span>&nbsp;</span>',
        '</span>',
    ].join('');
    const selectedBomb = await showDialog('Alchemical Crossbow Insufion', contentBombSelection, '#selected-bomb', bombs);
    if (selectedBomb === undefined) {
        return;
    }
    const { damageType } = selectedBomb.system.damage;
    xbow.update({
        'system.property1': { ...xbow.system.property1, damageType, dice: 1, die: 'd6', value: 'Alchemical Crossbow Infusion' },
        'flags.pf2e': { ...xbow.flags.pf2e, iscJavierAlchemicalCrossbow: { shots: 3 } },
    });
    selectedBomb.update({ 'data.quantity': selectedBomb.quantity - 1 });
    const content = `Infused Alchemical Crossbow with <strong>${selectedBomb.name}</strong>`;
    ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ token, actor }),
        content,
    });
})();
