(async () => {
  if (!game.combat) {
    return ui.notifications.error(game.i18n.localize('PF2E.Encounter.NoActiveEncounter'));
  }
  const actor = game.user.character;
  if (!actor) {
    return ui.notifications.error("You don't have a Character.");
  }
  const token = actor.getActiveTokens().pop();
  if (!token) {
    return ui.notifications.error(game.i18n.format('PF2E.Encounter.NoTokenInScene', { actor: actor.name }));
  }
  const combatant = await (async () => {
    const existing = game.combat.combatants.find((combatant) => combatant.actor === actor);
    if (existing) {
      return existing;
    }
    const combat = game.combat;
    const combatants = await combat.createEmbeddedDocuments(
      'Combatant',
      [
        {
          tokenId: token.id,
          actorId: actor.id,
          sceneId: token.scene.id,
          hidden: token.document.hidden,
        },
      ],
      { render: true }
    );
    return combatants.pop()!;
  })();

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

  const timestreams = [
    { id: 'normal', desc: 'Normal roll' },
    { id: 'stabilize', desc: 'Stabilize Timestream (10 + Modifier)' },
    { id: 'destabilize', desc: 'Destabilize Timestream ((FLAT DC 11 ? 19 : 1) + Modifier)' },
  ];
  const selectedTimestream = await showDialog(
    'Chronoskimmer Initiative',
    (() => {
      const timestreamsOptions = timestreams.map((timestream, index) => `<option value=${index}>${timestream.desc}.</option>`);
      return [
        '<span style="display:flex;flex-direction:column;justify-content:center;">',
        '<h3>Select an option for your Initiative:</h3>',
        `<select id="selected-timestream">${timestreamsOptions}</select>`,
        '<span>&nbsp;</span>',
        '</span>',
      ].join('');
    })(),
    '#selected-timestream',
    timestreams
  );
  if (selectedTimestream === undefined) {
    return;
  }

  const timestreamRoles = {
    normal: { fudge: async () => ({ fudgedValue: null, labelExtra: '' }) },
    stabilize: { fudge: async () => ({ fudgedValue: 10, labelExtra: '. Stabilize Timestream' }) },
    destabilize: {
      fudge: async () => {
        const flatCheck = new Roll('1d20').evaluate({ async: false });
        const degreeOfSuccess = flatCheck.total < 11 ? 'failure' : 'success';
        const degree = {
          dc: { value: 11, visible: true },
          rollTotal: flatCheck.total,
          adjustment: null,
          unadjusted: degreeOfSuccess,
          value: degreeOfSuccess,
        };
        const flavor = await (async () => {
          const result = await (async () => {
            const { dc } = degree;
            const { checkDCs } = CONFIG.PF2E;
            const dcData = (() => {
              const dcType = 'Chronoskimmer Dedication DC:';
              const labelKey = game.i18n.localize(checkDCs.Label.NoTarget);
              return {
                markup: game.i18n.format(labelKey, {
                  dcType,
                  dc: dc.value,
                  target: 11,
                }),
                visible: true,
              };
            })();
            const resultData = (() => {
              const offset = {
                value: new Intl.NumberFormat(game.i18n.lang, {
                  maximumFractionDigits: 0,
                  signDisplay: 'always',
                  useGrouping: false,
                }).format(degree.rollTotal - dc.value),
                visible: dc.visible,
              };
              const locPath = (dosKey: string) => `PF2E.Check.Result.Degree.Check.${dosKey}`;
              const unadjusted = game.i18n.localize(locPath(degree.unadjusted));
              const [adjusted, locKey] = [unadjusted, 'Label'];
              const markup = game.i18n.format(`PF2E.Check.Result.${locKey}`, {
                adjusted,
                unadjusted,
                offset: offset.value,
              });
              return {
                markup,
                visible: true,
              };
            })();
            const rendered = await renderTemplate('systems/pf2e/templates/chat/check/target-dc-result.hbs', {
              target: undefined,
              dc: dcData,
              result: resultData,
            });
            const html = (() => {
              const fragment = document.createElement('template');
              fragment.innerHTML = rendered;
              const element = fragment.content.firstElementChild;
              if (!(element instanceof HTMLElement)) throw ErrorPF2e('Unexpected error parsing HTML');
              return element;
            })();
            const convertXMLNode = (
              html: HTMLElement,
              name: string,
              { visible = undefined, visibility = undefined, whose = 'self', classes = [] }: ConvertXMLNodeOptions
            ) => {
              const node = html.querySelector(name);
              if (!node) return null;

              const span = document.createElement('span');
              const { dataset, classList } = span;

              if (visible !== undefined) {
                visibility = visible ? 'all' : 'gm';
              }
              if (visibility !== undefined) {
                dataset.visibility = visibility;
              }
              if (whose) {
                dataset.whose = whose;
              }
              for (const cssClass of classes) {
                classList.add(cssClass);
              }
              span.append(...Array.from(node.childNodes));
              node.replaceWith(span);
              return span;
            };
            convertXMLNode(html, 'unadjusted', {
              visible: resultData.visible,
              classes: [degree.value],
            });
            convertXMLNode(html, 'offset', {
              visible: dcData.visible,
              whose: 'target',
            });
            return html;
          })();
          const header = document.createElement('h4');
          header.classList.add('action');
          header.innerHTML = 'Destabilize Timestream flat check.';
          return [header, result]
            .flat()
            .map((e) => (typeof e == 'string' ? e : e.outerHTML))
            .join('');
        })();
        await flatCheck.toMessage({
          speaker: ChatMessage.getSpeaker({ actor, token }),
          flavor,
          flags: {
            pf2e: {
              context: {
                actor: actor.id,
                token: token.id,
                dc: 11,
                type: 'flat-check',
                title: 'Destabilize Timestream flat check.',
                outcome: degreeOfSuccess,
                unadjustedOutcome: degreeOfSuccess,
                traits: [],
              },
              unsafe: flavor,
            },
          },
        });
        const labelExtra = '. Destabilize Timestream';
        const fudgedValue = flatCheck.total < 11 ? 1 : 19;
        return { labelExtra, fudgedValue };
      },
    },
  };

  const { fudgedValue, labelExtra } = await timestreamRoles[selectedTimestream.id as keyof typeof timestreamRoles].fudge();

  const initSkill = actor.initiative.statistic;
  const buildFlavor = (label: string) => {
    const createTagFlavor = (check: PF2eCheck, extraTags: Array<string>) => {
      const toTagElement = (tag: { name?: string; label: string; description?: string }, cssClass: string) => {
        const span = document.createElement('span');
        span.classList.add('tag');
        span.classList.add(`tag_${cssClass}`);
        span.innerText = tag.label;
        tag.name && (span.dataset.slug = tag.name);
        tag.description && (span.dataset.description = tag.description);
        return span;
      };
      const modifiers = check.modifiers
        .filter((m) => m.enabled)
        .map((modifier) => {
          const sign = modifier.modifier < 0 ? '' : '+';
          const label = `${modifier.label} ${sign}${modifier.modifier}`;
          return toTagElement({ name: modifier.slug, label }, 'transparent');
        });
      const tagsFromOptions = extraTags.map((t) => toTagElement({ label: game.i18n.localize(t) }, 'transparent'));
      const modifiersAndExtras = document.createElement('div');
      modifiersAndExtras.className = 'tags';
      modifiersAndExtras.append(...modifiers, ...tagsFromOptions);
      return [document.createElement('hr'), modifiersAndExtras];
    };
    const tags = createTagFlavor(initSkill.check, fudgedValue === null ? [] : ['PF2E.TraitFortune']);
    const header = document.createElement('h4');
    header.classList.add('action');
    header.innerHTML = label;
    return [header, tags]
      .flat()
      .map((e) => (typeof e == 'string' ? e : e.outerHTML))
      .join('');
  };
  const flavor = buildFlavor(`Initiative: ${initSkill.label}${labelExtra}`);
  const options = initSkill.check.createRollOptions();
  if (fudgedValue !== null) {
    options.add('archetype');
    options.add('dedication');
    options.add('fortune');
  }
  const context = {
    actor: actor.id,
    token: token.id,
    domains: initSkill.domains,
    options: Array.from(options).sort(),
    rollMode: 'publicroll',
    title: 'Chronoskimmer Dedication',
    type: 'initiative',
  };

  const rollMessageData: RollMessageData = {
    speaker: ChatMessage.getSpeaker({ actor, token }),
    flavor,
    flags: {
      core: {
        canPopout: true,
        initiativeRoll: true,
      },
      pf2e: {
        context,
        unsafe: flavor,
        modifierName: initSkill.slug,
        modifiers: initSkill.modifiers.map((m) => m.toObject()),
      },
    },
  };
  const rollMessageOptions: RollMessageOptions = { create: false };
  const signedMod = initSkill.mod < 0 ? '' : '+' + initSkill.mod;
  const roll = new Roll(
    `1d20${signedMod}`,
    {},
    {
      rollerId: game.user.id,
      isReroll: false,
      totalModifier: initSkill.mod,
      domainds: initSkill.domains,
    }
  ).evaluate({ async: false });

  const message = await roll.toMessage(rollMessageData, rollMessageOptions);
  const initTotal = fudgedValue === null ? roll.total : fudgedValue + initSkill.mod;
  if (fudgedValue !== null) {
    const rollResult = JSON.parse(message.rolls[0]);
    rollResult.total = initTotal;
    rollResult.terms[0].results[0].result = fudgedValue;
    message.rolls[0] = JSON.stringify(rollResult);
  }
  await game.combat.setInitiative(combatant.id, initTotal);
  await ChatMessage.create(message);
})();
