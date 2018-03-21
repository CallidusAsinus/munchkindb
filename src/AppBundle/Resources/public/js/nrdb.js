$.fn.ignore = function (sel) {
    return this.clone().find(sel).remove().end();
};

function debounce(fn, delay) {
    var timer = null;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
}

function getDisplayDescriptions(sort) {
    var dd = {
        'type': [
            [// first column

            {
                id: 'monster',
                label: 'Monster',
                image: null
            }, {
                id: 'mischief',
                label: 'Mischief',
                image: null
            }, {
                id: 'loot',
                label: 'Loot',
                image: null
            }, {
                id: 'ally',
                label: 'Ally',
                image: null
            }, {
                id: 'location',
                label: 'Location',
                image: null
            }, {
                id: 'notype',
                label: 'Misc',
                image: null
            }
            ]
        ],
        'faction': [
            [],
            [{
                id: 'bard',
                label: 'Bard',
            }, {
                id: 'cleric',
                label: 'Cleric'
            }, {
                id: 'ranger',
                label: 'Ranger'
            }, {
                id: 'warrior',
                label: 'Warrior'
            }, {
                id: 'wizard',
                label: 'Wizard'
            }, {
                id: 'thief',
                label: 'Thief'
            }, {
                id: 'neutral',
                label: 'Neutral'
            }
            ],
        ],
        'number': [],
        'title': [
            [{
                id: 'cards',
                label: 'Cards',
            }],
        ],
    };
    return dd[sort];
}


function process_deck_by_type() {

    var bytype = {};
    Identity = NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: 'hero' }).pop();
    if (!Identity) {
        return;
    }

    NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: { '$ne': 'hero' } }, {
        type: 1,
        title: 1,
    }).forEach(function (card) {
        var type = card.type_code, keywords = card.keywords ? card.keywords.toLowerCase().split(" - ") : [];
        if (type == "ice") {
            var ice_type = [];
            if (keywords.indexOf("barrier") >= 0) {
                ice_type.push("barrier");
            }
            if (keywords.indexOf("code gate") >= 0) {
                ice_type.push("code-gate");
            }
            if (keywords.indexOf("sentry") >= 0) {
                ice_type.push("sentry");
            }
            switch (ice_type.length) {
                case 0:
                    type = "none";
                    break;
                case 1:
                    type = ice_type.pop();
                    break;
                default:
                    type = "multi";
                    break;
            }
        }
        if (type == "program") {
            if (keywords.indexOf("icebreaker") >= 0) {
                type = "icebreaker";
            }
        }
        var influence = 0, faction_code = '';
        if (card.faction_code != Identity.faction_code) {
            faction_code = card.faction_code;
            influence = card.faction_cost * card.indeck;
        }

        if (bytype[type] == null)
            bytype[type] = [];
        bytype[type].push({
            card: card,
            qty: card.indeck,
            influence: influence,
            faction: faction_code,
        });
    });
    bytype.identity = [{
        card: Identity,
        qty: 1,
        influence: 0,
        faction: '',
    }];

    return bytype;
}

function get_mwl_modified_card(card) {
    if (MWL && MWL.cards[card.code]) {
        return Object.assign(card, MWL.cards[card.code]);
    }

    return card;
}

function get_influence_penalty(card, qty) {
    if (typeof qty === "undefined") {
        qty = 1;
    }

    if (card.global_penalty && qty) {
        if (Identity.code === "03029" && card.type_code === "program") {
            // The Professor: first program is free
            qty -= 1;
        }

        return qty * card.global_penalty;
    }

    return 0;
}

function get_universal_faction_cost(card, qty) {
    if (typeof qty === "undefined") {
        qty = 1;
    }

    if (card.universal_faction_cost && qty) {
        return qty * card.universal_faction_cost;
    }

    return 0;
}

function get_influence_penalty_icons(card, qty) {
    var modifiedCard = get_mwl_modified_card(card);
    var penalty = get_influence_penalty(modifiedCard, qty) + get_universal_faction_cost(modifiedCard, qty);
    var icons = '';
    if (!penalty) {
        return '';
    }
    for (var i = 0; i < penalty; i++) {
        icons += '★';
    }
    return '<span title="Most Wanted List">' + icons + '</span>';
}

function find_identity() {
    Identity = NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: 'hero' }).pop();
}

function update_deck(options) {
    var restrainOneColumn = false;
    if (options) {
        if (options.restrainOneColumn)
            restrainOneColumn = options.restrainOneColumn;
    }

    find_identity();
    if (!Identity)
        return;

    //if (Identity.side_code === 'runner')
    //    $('#table-graph-strengths').hide();
    //else
    //    $('#table-graph-strengths').show();

    var displayDescription = getDisplayDescriptions(DisplaySort);
    if (displayDescription == null)
        return;

    if (DisplaySort === 'faction') {
        for (var i = 0; i < displayDescription[1].length; i++) {
            if (displayDescription[1][i].id === Identity.faction_code) {
                displayDescription[0] = displayDescription[1].splice(i, 1);
                break;
            }
        }
    }
    if (DisplaySort === 'number' && displayDescription.length === 0) {
        var rows = [];
        NRDB.data.packs.find().forEach(function (pack) {
            rows.push({ id: pack.code, label: pack.name });
        });
        displayDescription.push(rows);
    }
    if (restrainOneColumn && displayDescription.length == 2) {
        displayDescription = [displayDescription[0].concat(displayDescription[1])];
    }

    $('#deck-content').empty();
    var cols_size = 12 / displayDescription.length;
    for (var colnum = 0; colnum < displayDescription.length; colnum++) {
        var rows = displayDescription[colnum];
        var div = $('<div>').addClass('col-sm-' + cols_size).appendTo($('#deck-content'));
        for (var rownum = 0; rownum < rows.length; rownum++) {
            var row = rows[rownum];
            var item = $('<h5> ' + row.label + ' (<span></span>)</h5>').hide();
            if (row.image) {
                $('<img>').addClass(DisplaySort + '-icon').attr('src', row.image).attr('alt', row.label).prependTo(item);
            } else if (DisplaySort == "faction") {
                $('<span class="icon icon-' + row.id + ' ' + row.id + '"></span>').prependTo(item);
            }
            var content = $('<div class="deck-' + row.id + '"></div>');
            div.append(item).append(content);
        }
    }

    InfluenceLimit = 0;
    var cabinet = {};
    var parts = Identity.title.split(/: /);
    $('#identity').html('<a href="' + Routing.generate('cards_zoom', { card_code: Identity.code }) + '" data-target="#cardModal" data-remote="false" class="card" data-toggle="modal" data-index="' + Identity.code + '">' + parts[0]);
    $('#img_identity').prop('src', Identity.imageUrl);
    InfluenceLimit = Identity.influence_limit;
    if (typeof InfluenceLimit === "undefined")
        InfluenceLimit = Number.POSITIVE_INFINITY;

    check_decksize();

    var orderBy = {};
    switch (DisplaySort) {
        case 'type':
            orderBy['type_code'] = 1;
            break;
        case 'faction':
            orderBy['faction_code'] = 1;
            break;
        case 'number':
            orderBy['code'] = 1;
            break;
        case 'title':
            orderBy['title'] = 1;
            break;
    }
    switch (DisplaySortSecondary) {
        case 'type':
            orderBy['type_code'] = 1;
            break;
        case 'faction':
            orderBy['faction_code'] = 1;
            break;
        case 'number':
            orderBy['code'] = 1;
            break;
    }
    orderBy['title'] = 1;

    var latestpack = Identity.pack;
    var influenceSpent = {};

    NRDB.data.cards.find({
        indeck: { '$gt': 0 },
        type_code: { '$ne': 'hero' },
    }, { '$orderBy': orderBy }).forEach(function (card) {
        if (latestpack.cycle.position < card.pack.cycle.position
            || (latestpack.cycle.position == card.pack.cycle.position && latestpack.position < card.pack.position)) {
            latestpack = card.pack;
        }

        var influence = '';
        if (card.faction_code != Identity.faction_code) {
            var theorical_influence_spent = card.indeck * card.faction_cost;
            influenceSpent[card.code] = get_influence_cost_of_card_in_deck(card);
            for (var i = 0; i < theorical_influence_spent; i++) {
                if (i && i % 5 == 0)
                    influence += " ";
                influence += (i < influenceSpent[card.code] ? "●" : "○");
            }

            influence = ' <span class="influence influence-' + card.faction_code + '">' + influence + '</span>';
        }

        var criteria = null;
        var additional_info = get_influence_penalty_icons(card, card.indeck) + influence;

        if (DisplaySort === 'type') {
            criteria = card.type_code, keywords = card.keywords ? card.keywords.toLowerCase().split(" - ") : [];
            if (criteria == "ice") {
                var ice_type = [];
                if (keywords.indexOf("barrier") >= 0)
                    ice_type.push("barrier");
                if (keywords.indexOf("code gate") >= 0)
                    ice_type.push("code-gate");
                if (keywords.indexOf("sentry") >= 0)
                    ice_type.push("sentry");
                switch (ice_type.length) {
                    case 0:
                        criteria = "none";
                        break;
                    case 1:
                        criteria = ice_type.pop();
                        break;
                    default:
                        criteria = "multi";
                        break;
                }
            }
            if (criteria == "program") {
                if (keywords.indexOf("icebreaker") >= 0)
                    criteria = "icebreaker";
            }
        } else if (DisplaySort === 'faction') {
            criteria = card.faction_code;
        } else if (DisplaySort === 'number') {
            criteria = card.pack_code;
        } else if (DisplaySort === 'title') {
            criteria = 'cards';
        }

        if (DisplaySort === 'number' || DisplaySortSecondary === 'number') {
            var number_of_sets = Math.ceil(card.indeck / card.quantity);
            var alert_number_of_sets = number_of_sets > 1 ? '<small class="text-warning">' + number_of_sets + ' sets needed</small> ' : '';
            additional_info = '(<span class="small icon icon-' + card.pack.cycle.code + '"></span> ' + card.position + ') ' + alert_number_of_sets + influence;
        }

        var mwlCard = get_mwl_modified_card(card);
        var unicorn = mwlCard.is_restricted ? '<span style="display:inline-block;width:1.5em;">🦄</span> ' : '';
        var item = $('<div>' + card.indeck + 'x <a href="' + Routing.generate('cards_zoom', { card_code: card.code }) + '" class="card" data-toggle="modal" data-remote="false" data-target="#cardModal" data-index="' + card.code + '">' + card.title + ' <span class="code">#'+card.code+'</span></a> ' + unicorn + additional_info + '</div>');
        item.appendTo($('#deck-content .deck-' + criteria));

        cabinet[criteria] |= 0;
        cabinet[criteria] = cabinet[criteria] + card.indeck;
        $('#deck-content .deck-' + criteria).prev().show().find('span:last').html(cabinet[criteria]);

    });
    $('#latestpack').html('Cards up to <i>' + latestpack.name + '</i>');
    if (NRDB.settings && NRDB.settings.getItem('show-onesies')) {
        show_onesies();
    } else {
        $('#onesies').hide();
    }
    if (NRDB.settings && NRDB.settings.getItem('show-cacherefresh')) {
        show_cacherefresh();
    } else {
        $('#cacherefresh').hide();
    }
    check_influence(influenceSpent);
    check_restricted();
    check_deck_limit();
    if ($('#costChart .highcharts-container').length)
        setTimeout(make_cost_graph, 100);
    if ($('#strengthChart .highcharts-container').length)
        setTimeout(make_strength_graph, 100);
}

function show_onesies() {
    var content = test_onesies() ? '<span class="text-success glyphicon glyphicon-ok"></span> 1.1.1.1 format compliant' : '<span class="text-danger glyphicon glyphicon-remove"></span> Non 1.1.1.1 format compliant';
    $('#onesies').html(content).show();
}

function show_cacherefresh() {
    var content = test_cacherefresh() ? '<span class="text-success glyphicon glyphicon-ok"></span> Cache Refresh format compliant' : '<span class="text-danger glyphicon glyphicon-remove"></span> Non Cache Refresh format compliant';
    $('#cacherefresh').html(content).show();
}

function test_cacherefresh() {
    var all_cards = _.map(NRDB.data.cards.find({ indeck: { '$gt': 0 } }), 'code'),
        accepted_cards = [];

    // core set check
    NRDB.data.cards.find({ indeck: { '$gt': 0 }, pack_code: 'core2' }).forEach(function (card) {
        if (card.indeck <= card.quantity) {
            accepted_cards.push(card.code);
        }
    });

    // terminal directive check
    NRDB.data.cards.find({ indeck: { '$gt': 0 }, pack_code: 'td' }).forEach(function (card) {
        if (card.indeck <= card.quantity) {
            accepted_cards.push(card.code);
        }
    });

    // deluxe and last-two-cycles check
    var remaining_cards = NRDB.data.cards.find({
        indeck: { '$gt': 0 },
        pack_code: { '$ne': 'core2' },
        code: { '$nin': accepted_cards },
    });
    var packs = _.values(_.reduce(remaining_cards, function (acc, card) {
        if (!acc[card.pack.code])
            acc[card.pack.code] = { pack: card.pack, count: 0 };
        acc[card.pack.code].count++;
        return acc;
    }, {})).sort(function (a, b) {
        return b.count - a.count;
    });
    var all_deluxes = [
        'creation-and-control',
        'honor-and-profit',
        'order-and-chaos',
        'data-and-destiny',
    ];
    var deluxe = _.find(packs, function (element) {
        return _.includes(all_deluxes, element.pack.cycle.code);
    });

    var allCycles = NRDB.data.cycles.find({ 'size': { '$gt': 1 } }, { '$orderBy': { 'position': -1 } } );

    // check if the last cycle already has released packs, skip it if not
    let lastCycleCode = allCycles[0].code;
    var packs = NRDB.data.packs.find( { 'cycle_code': lastCycleCode, 'date_release': { '$nee': null} } );
    if (packs.length == 0) {
        allCycles.shift();
    }

    var cycles = [ allCycles[0].code, allCycles[1].code ];

    remaining_cards.forEach(function (card) {
        if (deluxe && card.pack.code === deluxe.pack.code)
            accepted_cards.push(card.code);
        if (cycles.indexOf(card.pack.cycle_code) > -1)
            accepted_cards.push(card.code);
    });

    // all cards must match -- even identities
    if (all_cards.length === accepted_cards.length)
        return true;

    return false;
}

function test_onesies() {
    var all_cards = _.map(NRDB.data.cards.find({ type_code: { '$ne': 'hero' }, indeck: { '$gt': 0 } }), 'code'),
        accepted_cards = [];

    // core set check
    NRDB.data.cards.find({
        type_code: { '$ne': 'hero' },
        indeck: { '$gt': 0 },
        pack_code: 'core',
    }).forEach(function (card) {
        if (card.indeck <= card.quantity) {
            accepted_cards.push(card.code);
        }
    });

    // deluxe and datapack check
    var remaining_cards = NRDB.data.cards.find({
        type_code: { '$ne': 'hero' },
        indeck: { '$gt': 0 },
        pack_code: { '$ne': 'core' },
        code: { '$nin': accepted_cards },
    });
    var packs = _.values(_.reduce(remaining_cards, function (acc, card) {
        if (!acc[card.pack.code])
            acc[card.pack.code] = { pack: card.pack, count: 0 };
        acc[card.pack.code].count++;
        return acc;
    }, {})).sort(function (a, b) {
        return b.count - a.count;
    });
    var deluxe = _.find(packs, function (element) {
        return element.pack.cycle.size === 1;
    });
    var datapack = _.find(packs, function (element) {
        return element.pack.cycle.size > 1;
    });
    remaining_cards.forEach(function (card) {
        if (deluxe && card.pack.code === deluxe.pack.code)
            accepted_cards.push(card.code);
        if (datapack && card.pack.code === datapack.pack.code)
            accepted_cards.push(card.code);
    });

    // conclusion with an accepted difference of 1
    if (all_cards.length <= accepted_cards.length + 1)
        return true;

    return false;
}

function check_decksize() {
    DeckSize = _.reduce(
        NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: { '$ne': 'hero' } }),
        function (acc, card) {
            return acc + card.indeck;
        },
        0);
    MinimumDeckSize = Identity.minimum_deck_size;
    $('#cardcount').html(DeckSize + " cards")[DeckSize != 40 ? 'addClass' : 'removeClass']("text-danger");
    if (Identity.side_code == 'corp') {
        AgendaPoints = _.reduce(
            NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: 'agenda' }),
            function (acc, card) {
                return acc + card.indeck * card.agenda_points;
            },
            0);
        var min = Math.floor(Math.max(DeckSize, MinimumDeckSize) / 5) * 2 + 2, max = min + 1;
        $('#agendapoints').html(AgendaPoints + " agenda points (between " + min + " and " + max + ")")[AgendaPoints < min || AgendaPoints > max ? 'addClass' : 'removeClass']("text-danger");
    } else {
        $('#agendapoints').empty();
    }
}

function count_card_copies(cards) {
    var count = 0;
    for (var i = 0; i < cards.length; i++) {
        count += cards[i].indeck;
    }
    return count;
}

function get_influence_cost_of_card_in_deck(card) {
    var inf = card.indeck * card.faction_cost;
    if (inf) {
        if (Identity.code == "03029" && card.type_code == "program") {
            // The Professor: first program is free
            inf = (card.indeck - 1) * card.faction_cost;
        } else if (card.code === '10018') {
            // Mumba Temple: 15 or fewer ice
            if (count_card_copies(NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: 'ice' })) <= 15) {
                inf = 0;
            }
        } else if (card.code === '10019') {
            // Museum of History: 50 or more cards
            if (DeckSize >= 50) {
                inf = 0;
            }
        } else if (card.code === '10038') {
            // PAD Factory: 3 PAD Campaign
            if (count_card_copies(NRDB.data.cards.find({ indeck: { '$gt': 0 }, code: ['01109', '20128'] })) === 3) {
                inf = 0;
            }
        } else if (card.code === '10076') {
            // Mumbad Virtual Tour: 7 or more assets
            if (count_card_copies(NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: 'asset' })) >= 7) {
                inf = 0;
            }
        } else if (card.keywords && card.keywords.match(/Alliance/)) {
            // 6 or more non-alliance cards of the same faction
            var same_faction_cards = NRDB.data.cards.find({ indeck: { '$gt': 0 }, faction_code: card.faction_code });
            var alliance_count = 0;
            same_faction_cards.forEach(function (same_faction_card) {
                if (same_faction_card.keywords && same_faction_card.keywords.match(/Alliance/))
                    return;
                alliance_count += same_faction_card.indeck;
            });
            if (alliance_count >= 6) {
                inf = 0;
            }
        }
    }
    return inf;
}

function check_influence(influenceSpent) {
    var deckContent = NRDB.data.cards.find({ indeck: { '$gt': 0 } });

    InfluenceSpent = _.reduce(
        deckContent,
        function (acc, card) {
            return acc + (influenceSpent[card.code] || 0) + get_universal_faction_cost(get_mwl_modified_card(card), card.indeck);
        }
        , 0);

    var influencePenalty = _.reduce(
        deckContent,
        function (acc, card) {
            return acc + get_influence_penalty(get_mwl_modified_card(card), card.indeck);
        }
        , 0);

    var displayInfluenceLimit = InfluenceLimit,
        remainingInfluence = Math.max(1, InfluenceLimit - influencePenalty),
        availableInfluence = remainingInfluence - InfluenceSpent;
    if (InfluenceLimit !== remainingInfluence) {
        displayInfluenceLimit = InfluenceLimit + '-' + influencePenalty + '★=' + (InfluenceLimit - influencePenalty);
    }
    if (InfluenceLimit === Number.POSITIVE_INFINITY) {
        displayInfluenceLimit = "&#8734;";
    }
    var isOver = remainingInfluence < InfluenceSpent;
}

function check_restricted() {
    var nb_restricted = 0;
    NRDB.data.cards.find({ indeck: { '$gt': 0 } }).forEach(function (card) {
        var modified_card = get_mwl_modified_card(card);
        if(modified_card.is_restricted) {
            nb_restricted++;
        }
    });

    if(nb_restricted > 1) {
        $('#restricted').text('More than 1 restricted card included').show();
    } else {
        $('#restricted').text('').hide();
    }
}

function check_deck_limit() {
    var nb_violations = 0;
    NRDB.data.cards.find({ indeck: { '$gt': 0 } }).forEach(function (card) {
        var modified_card = get_mwl_modified_card(card);
        if(modified_card.deck_limit < card.indeck) {
            nb_violations++;
        }
    });

    if(nb_violations > 0) {
        $('#limited').text('Too many copies of a limited card').show();
    } else {
        $('#limited').text('').hide();
    }
}

$(function () {

    $('[data-toggle="tooltip"]').tooltip();

    $.each(['table-graph-costs', 'table-graph-strengths', 'table-predecessor', 'table-parent', 'table-successor', 'table-draw-simulator', 'table-suggestions'], function (i, table_id) {
        var table = $('#' + table_id);
        if (!table.length)
            return;
        var head = table.find('thead tr th');
        var toggle = $('<a href="#" class="pull-right small">hide</a>');
        toggle.on({ click: toggle_table });
        head.prepend(toggle);
    });

    $('#oddsModal').on({ change: oddsModalCalculator }, 'input');

    $('body').on({
        click: function (event) {
            var element = $(this);
            if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
                event.stopPropagation();
                return;
            }
            if (NRDB.card_modal)
                NRDB.card_modal.display_modal(event, element);
        },
    }, '.card');

    $('#filter-text-button').tooltip({
        html: true,
        container: 'body',
        placement: 'bottom',
        trigger: 'click',
        title: "<h5>Smart filter syntax</h5><ul style=\"text-align:left\"><li>x: filters on text</li><li>t: type</li><li>s: subtype</li></ul></h5>"
    });
});

function oddsModalCalculator(event) {
    var inputs = {};
    $.each(['N', 'K', 'n', 'k'], function (i, key) {
        inputs[key] = parseInt($('#odds-calculator-' + key).val(), 10) || 0;
    });
    $('#odds-calculator-p').text(Math.round(100 * hypergeometric.get_cumul(inputs.k, inputs.N, inputs.K, inputs.n)));
}

function toggle_table(event) {
    event.preventDefault();
    var toggle = $(this);
    var table = toggle.closest('table');
    var tbody = table.find('tbody');
    tbody.toggle(400, function () {
        toggle.text(tbody.is(':visible') ? 'hide' : 'show');
    });
}

var FactionColors = {
    "anarch": "#FF4500",
    "criminal": "#4169E1",
    "shaper": "#32CD32",
    "neutral-runner": "#708090",
    "haas-bioroid": "#8A2BE2",
    "jinteki": "#DC143C",
    "nbn": "#FF8C00",
    "weyland-consortium": "#006400",
    "neutral-corp": "#708090",
};

function build_bbcode(deck) {
    var deck = process_deck_by_type(deck || SelectedDeck);
    var lines = [];
    lines.push("[b]" + SelectedDeck.name + "[/b]");
    lines.push("");
    lines.push('[url=https://munchkindb.com/' + NRDB.locale + '/card/'
        + Identity.code
        + ']'
        + Identity.title
        + '[/url] ('
        + Identity.pack.name
        + ")");

    $('#deck-content > div > h5:visible, #deck-content > div > div > div').each(function (i, line) {
        switch ($(line).prop("tagName")) {
            case "H5":
                lines.push("");
                lines.push("[b]" + $(line).text().trim() + "[/b]");
                break;
            default:
                var qty = $(line).ignore("a, span, small").text().trim().replace(/x.*/, "x");
                var inf = $(line).find("span").text().trim();
                var card = NRDB.data.cards.findById($(line).find('a.card').data('index'));
                lines.push(qty + ' [url=https://munchkindb.com/' + NRDB.locale + '/card/'
                    + card.code
                    + ']'
                    + card.title
                    + '[/url] [i]('
                    + card.pack.name
                    + ")[/i] "
                    + (inf ? '[color=' + FactionColors[card.faction_code] + ']' + inf + '[/color]' : '')
                );
        }
    });

    lines.push($('#influence').text().replace(/•/g, ''));
    if (Identity.side_code == 'corp') {
        lines.push($('#agendapoints').text());
    }
    lines.push($('#cardcount').text());
    lines.push($('#latestpack').text());
    lines.push("");
    if (typeof Decklist != "undefined" && Decklist != null) {
        lines.push("Decklist [url=" + location.href + "]published on MunchkinDB[/url].");
    } else {
        lines.push("Deck built on [url=https://munchkindb.com]MunchkinDB[/url].");
    }
    return lines;
}

function export_bbcode() {
    $('#export-deck').html(build_bbcode().join("\n"));
    $('#exportModal').modal('show');
}

function build_markdown(deck) {
    var deck = process_deck_by_type(deck || SelectedDeck);
    var lines = [];
    lines.push("## " + SelectedDeck.name);
    lines.push("");
    lines.push('['
        + Identity.title
        + '](https://munchkindb.com/' + NRDB.locale + '/card/'
        + Identity.code
        + ') _('
        + Identity.pack.name
        + ")_");

    $('#deck-content > div > h5:visible, #deck-content > div > div > div').each(function (i, line) {
        switch ($(line).prop("tagName")) {
            case "H5":
                lines.push("");
                lines.push("###" + $(line).text());
                break;
            default:
                var qty = $(line).ignore("a, span, small").text().trim().replace(/x.*/, "x");
                var inf = $(line).find("span").text().trim();
                var card = NRDB.data.cards.findById($(line).find('a.card').data('index'));
                lines.push('* ' + qty + ' ['
                    + card.title
                    + '](https://munchkindb.com/' + NRDB.locale + '/card/'
                    + card.code
                    + ') _('
                    + card.pack.name
                    + ")_ "
                    + inf
                );
        }
    });

    lines.push("");
    lines.push($('#influence').text().replace(/•/g, '') + "  ");
    if (Identity.side_code == 'corp') {
        lines.push($('#agendapoints').text() + "  ");
    }
    lines.push($('#cardcount').text() + "  ");
    lines.push($('#latestpack').text() + "  ");
    lines.push("");
    if (typeof Decklist != "undefined" && Decklist != null) {
        lines.push("Decklist [published on MunchkinDB](" + location.href + ").");
    } else {
        lines.push("Deck built on [MunchkinDB](https://munchkindb.com).");
    }
    return lines;
}

function export_markdown() {
    $('#export-deck').html(build_markdown().join("\n"));
    $('#exportModal').modal('show');
}

function build_plaintext(deck) {
    var deck = process_deck_by_type(deck || SelectedDeck);
    var lines = [];
    lines.push(SelectedDeck.name);
    lines.push("");
    lines.push(Identity.title);

    $('#deck-content > div > h5:visible, #deck-content > div > div > div').each(function (i, line) {
        switch ($(line).prop("tagName")) {
            case "H5":
                lines.push("");
                lines.push($(line).text().trim());
                break;
            default:
                lines.push($(line).text().trim());
        }
    });

    lines.push("");
    lines.push($('#influence').text().replace(/•/g, ''));
    if (Identity.side_code == 'corp') {
        lines.push($('#agendapoints').text());
    }
    lines.push($('#cardcount').text());
    lines.push($('#latestpack').text());
    lines.push("");
    if (typeof Decklist != "undefined" && Decklist != null) {
        lines.push("Decklist published on https://munchkindb.com.");
    } else {
        lines.push("Deck built on https://munchkindb.com.");
    }
    return lines;
}

function export_plaintext() {
    $('#export-deck').html(build_plaintext().join("\n"));
    $('#exportModal').modal('show');
}

function build_jintekinet(deck) {
    var deck = process_deck_by_type(deck || SelectedDeck);
    var lines = [];

    $('#deck-content > div > div > div').each(function (i, line) {
        var num = $(line).contents().filter(function () {
            return this.nodeType == 3;
        })[0].nodeValue[0];
        var name = $(line).children('a').eq(0).text();
        lines.push(num + " " + name);
    });
    return lines;
}

function export_jintekinet() {
    $('#export-deck').html(build_jintekinet().join("\n"));
    $('#exportModal').modal('show');
}

function make_cost_graph() {
    var costs = [];

    NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: { '$ne': 'hero' } }).forEach(function (card) {
        if (card.cost != null) {
            if (costs[card.cost] == null)
                costs[card.cost] = [];
            if (costs[card.cost][card.type.name] == null)
                costs[card.cost][card.type.name] = 0;
            costs[card.cost][card.type.name] += card.indeck;
        }
    });

    // costChart
    var cost_series = Identity.side_code === 'runner' ?
        [{ name: 'Event', data: [] }, { name: 'Resource', data: [] }, { name: 'Hardware', data: [] }, {
            name: 'Program',
            data: [],
        }]
        : [{ name: 'Operation', data: [] }, { name: 'Upgrade', data: [] }, { name: 'Asset', data: [] }, {
            name: 'ICE',
            data: [],
        }];
    var xAxis = [];

    for (var j = 0; j < costs.length; j++) {
        xAxis.push(j);
        var data = costs[j];
        for (var i = 0; i < cost_series.length; i++) {
            var type_name = cost_series[i].name;
            cost_series[i].data.push(data && data[type_name] ? data[type_name] : 0);
        }
    }
}

function make_strength_graph() {
    var strengths = [];
    var ice_types = ['Barrier', 'Code Gate', 'Sentry', 'Other'];

    NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: { '$ne': 'hero' } }).forEach(function (card) {
        if (card.strength != null) {
            if (strengths[card.strength] == null)
                strengths[card.strength] = [];
            var ice_type = 'Other';
            for (var i = 0; i < ice_types.length; i++) {
                if (card.keywords.indexOf(ice_types[i]) != -1) {
                    ice_type = ice_types[i];
                    break;
                }
            }
            if (strengths[card.strength][ice_type] == null)
                strengths[card.strength][ice_type] = 0;
            strengths[card.strength][ice_type] += card.indeck;
        }
    });

    // strengthChart
    var strength_series = [];
    for (var i = 0; i < ice_types.length; i++)
        strength_series.push({ name: ice_types[i], data: [] });
    var xAxis = [];

    for (var j = 0; j < strengths.length; j++) {
        xAxis.push(j);
        var data = strengths[j];
        for (var i = 0; i < strength_series.length; i++) {
            var type_name = strength_series[i].name;
            strength_series[i].data.push(data && data[type_name] ? data[type_name] : 0);
        }
    }
}

//binomial coefficient module, shamelessly ripped from https://github.com/pboyer/binomial.js
var binomial = {};
(function (binomial) {
    var memo = [];
    binomial.get = function (n, k) {
        if (k === 0) {
            return 1;
        }
        if (n === 0 || k > n) {
            return 0;
        }
        if (k > n - k) {
            k = n - k;
        }
        if (memo_exists(n, k)) {
            return get_memo(n, k);
        }
        var r = 1,
            n_o = n;
        for (var d = 1; d <= k; d++) {
            if (memo_exists(n_o, d)) {
                n--;
                r = get_memo(n_o, d);
                continue;
            }
            r *= n--;
            r /= d;
            memoize(n_o, d, r);
        }
        return r;
    };

    function memo_exists(n, k) {
        return (memo[n] != undefined && memo[n][k] != undefined);
    }

    function get_memo(n, k) {
        return memo[n][k];
    }

    function memoize(n, k, val) {
        if (memo[n] === undefined) {
            memo[n] = [];
        }
        memo[n][k] = val;
    }
})(binomial);

// hypergeometric distribution module, homemade
var hypergeometric = {};
(function (hypergeometric) {
    var memo = [];
    hypergeometric.get = function (k, N, K, n) {
        if (!k || !N || !K || !n)
            return 0;
        if (memo_exists(k, N, K, n)) {
            return get_memo(k, N, K, n);
        }
        if (memo_exists(n - k, N, N - K, n)) {
            return get_memo(n - k, N, N - K, n);
        }
        if (memo_exists(K - k, N, K, N - n)) {
            return get_memo(K - k, N, K, N - n);
        }
        if (memo_exists(k, N, n, K)) {
            return get_memo(k, N, n, K);
        }
        var d = binomial.get(N, n);
        if (d === 0)
            return 0;
        var r = binomial.get(K, k) * binomial.get(N - K, n - k) / d;
        memoize(k, N, K, n, r);
        return r;
    };
    hypergeometric.get_cumul = function (k, N, K, n) {
        var r = 0;
        for (; k <= n; k++) {
            r += hypergeometric.get(k, N, K, n);
        }
        return r;
    };

    function memo_exists(k, N, K, n) {
        return (memo[k] != undefined && memo[k][N] != undefined && memo[k][N][K] != undefined && memo[k][N][K][n] != undefined);
    }

    function get_memo(k, N, K, n) {
        return memo[k][N][K][n];
    }

    function memoize(k, N, K, n, val) {
        if (memo[k] === undefined) {
            memo[k] = [];
        }
        if (memo[k][N] === undefined) {
            memo[k][N] = [];
        }
        if (memo[k][N][K] === undefined) {
            memo[k][N][K] = [];
        }
        memo[k][N][K][n] = val;
    }
})(hypergeometric);


/* my version of button.js, overriding twitter's */

(function ($) {
    "use strict";

    // BUTTON PUBLIC CLASS DEFINITION
    // ==============================

    var Button = function (element, options) {
        this.$element = $(element);
        this.options = $.extend({}, Button.DEFAULTS, options);
        this.isLoading = false;
    };

    Button.DEFAULTS = {
        loadingText: 'loading...',
    };

    Button.prototype.setState = function (state) {
        var d = 'disabled';
        var $el = this.$element;
        var val = $el.is('input') ? 'val' : 'html';
        var data = $el.data();

        state = state + 'Text';

        if (!data.resetText)
            $el.data('resetText', $el[val]());

        $el[val](data[state] || this.options[state]);

        // push to event loop to allow forms to submit
        setTimeout($.proxy(function () {
            if (state == 'loadingText') {
                this.isLoading = true;
                $el.addClass(d).attr(d, d);
            } else if (this.isLoading) {
                this.isLoading = false;
                $el.removeClass(d).removeAttr(d);
            }
        }, this), 0);
    };

    Button.prototype.toggle = function () {
        var changed = true;
        var $parent = this.$element.closest('[data-toggle="buttons"]');

        if ($parent.length) {
            var $input = this.$element.find('input');
            if ($input.prop('type') == 'radio') {
                if ($input.prop('checked') && this.$element.hasClass('active'))
                    changed = false;
                else
                    $parent.find('.active').removeClass('active');
            }
            if (changed)
                $input.prop('checked', !this.$element.hasClass('active')).trigger('change');
        }

        if (changed)
            this.$element.toggleClass('active');
    };

    Button.prototype.on = function () {
        var changed = true;
        var $parent = this.$element.closest('[data-toggle="buttons"]');

        if ($parent.length) {
            var $input = this.$element.find('input');
            if ($input.prop('type') == 'radio' || invertOthers) {
                if ($input.prop('checked') && this.$element.hasClass('active'))
                    changed = false;
                else
                    $parent.find('.active').removeClass('active');
            }
            if (changed)
                $input.prop('checked', !this.$element.hasClass('active')).trigger('change');
        }

        if (changed)
            this.$element.addClass('active');
    };

    Button.prototype.off = function () {
        var changed = true;
        var $parent = this.$element.closest('[data-toggle="buttons"]');

        if ($parent.length) {
            var $input = this.$element.find('input');
            if ($input.prop('type') == 'radio' || invertOthers) {
                if ($input.prop('checked') && this.$element.hasClass('active'))
                    changed = false;
                else
                    $parent.find('.active').removeClass('active');
            }
            if (changed)
                $input.prop('checked', !this.$element.hasClass('active')).trigger('change');
        }

        if (changed)
            this.$element.removeClass('active');
    };


    // BUTTON PLUGIN DEFINITION
    // ========================

    var old = $.fn.button;

    $.fn.button = function (option, invertOthers) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('bs.button');
            var options = typeof option == 'object' && option;

            if (!data)
                $this.data('bs.button', (data = new Button(this, options)));

            switch (option) {
                case 'toggle':
                    data.toggle();
                    break;
                case 'off':
                    data.off(invertOthers);
                    break;
                case 'on':
                    data.on(invertOthers);
                    break;
                default:
                    data.setState(option);
                    break;
            }
        });
    };

    $.fn.button.Constructor = Button;


    // BUTTON NO CONFLICT
    // ==================

    $.fn.button.noConflict = function () {
        $.fn.button = old;
        return this;
    };

})(window.jQuery);
