"use strict";

var numbers = {
	s       : 10,
	cards   : 13
};
var symbols = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k',	'a'];
var suits   = ['clubs', 'diams', 'hearts', 'spades'];
var mousePosition = {
		x : undefined,
		y : undefined
	};
window.document.onmousemove = function (e) {
		mousePosition.x = e.pageX;
		mousePosition.y = e.pageY;
	};
var win = 0;
var flag;
var me = {}, room = {};

function bigint (n, b) {
	b = b || 10;

	return new BigInteger(n, b);
}

function random (n) {
	var r = Math.random() * Date.now();
	var x = (mousePosition.x || 1) * (mousePosition.y || 1);
	var i = Math.floor(x * Date.now()) % 100 + 1;

	var hashFactory = new jsSHA(r.toString(), 'TEXT');
	var hash        = hashFactory.getHash('SHA-512', 'HEX', i);

	return n ? bigint(hash, 16).mod(n) : bigint(hash, 16);
}

function odd_random (q) {
	var r;
	while (true) { 
        r = random(q)

        if (r.modInt(2) !== 0)
            break;
	}

    return r;
}

function range (n) { 
	var a = new Array(n);
	
	for (var i = 0; i < n; i++) {
		a[i] = i;
	}

	return a;
}

function zip (a, b) {
	if (a.length !== b.length)
		throw 'zip error!';

	return a.map( function (x, i) { return [x, b[i]]; } );
}

function jsonify (o) {
	return JSON.stringify(o, function (_, v) {
			return (v instanceof BigInteger) ? v.toString() : v;
		} );
}

function make_pi (n) {
	var n = n || numbers.cards;
	
	var a = range(n);
	for(var i = n - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var tmp = a[i];
		a[i] = a[j];
		a[j] = tmp;
	}

	return a;
}

function permute (pi, d) {
	if (pi.length !== d.length)
		throw 'permute error!';

	return pi.map( function (i) { return d[i]; } );
}

function compose (pi2, pi1) {
	if (pi1.length !== pi2.length)
		throw 'compose error!';

	return pi2.map( function (i) { return pi1[i]; } );
}
	
function inverse (pi) {
	return range(pi.length)
		.map( function (i) {
			return [pi[i], i];
		})
		.sort( function (a, b) {
			return a[0] - b[0];
		})
		.map( function (x) {
			return x[1];
		});
}

function mask (s) {
	var s    = s || numbers.s;
	var bool = [true, false]; 

	return range(s)
		.map( function (i) {
			return bool[ Math.floor(Math.random() * bool.length) ]
		} );
}

function procedure_32 (c0, p, q) {
	var r  = range(c0.length).map( function () { return odd_random(q); } );
	var c  = zip(c0, r).map( function (x) {
			return [ x[0][0].modPow(x[1], p), x[0][1].modPow(x[1], p) ];
		});
	var pi = make_pi();

	if (pi.length !== c0.length)
		throw 'error in procedure_33';

	return [ permute(pi, c), r, pi ];
}

function procedure_33 (ca, cb, r, pi, p) {
	return range(numbers.cards).every( function (i) {
			var db_i = cb[i][0], ab_i = cb[i][1];
			var da_i = ca[pi[i]][0], aa_i = ca[pi[i]][1];

			var r_i = r[pi[i]]

			return db_i.equals(da_i.modPow(r_i, p)) && ab_i.equals(aa_i.modPow(r_i, p))
		} );
}

function cp_proof (alpha, beta, er, er_1, c, r, a, b, p) {
    return alpha.modPow(r, p).equals(a.multiply(beta.modPow(c, p)).mod(p)) && 
			er.modPow(r, p).equals(b.multiply(er_1.modPow(c, p)).mod(p));
}

function get_card (m_card, x, p) {
	var c = m_card[1], d = m_card[0];

	for (var i = 0; i < x.length; i++) {
		if (c.modPow(x[i], p).equals(d)) {
			return i;
		}
	}

	throw 'fail to get card';
}

function extracted_cards (i, cs) {
	if (i >= cs.length)
		throw 'the index must be smaller than cards length';

	return cs.slice(0, i).concat(cs.slice(i + 1));
}

function card_of_string (c) {
	if (c.length !== 2)
		throw 'cards length must be 2';

	return [bigint(c[0]), bigint(c[1])];
}

function eq_cards (a, b) {
	if (a.length !== b.length || a.length !== 2)
		throw 'cards length are not equal';

	return a[0].equals(b[0]) && a[1].equals(b[1]);
}

function index_of_card (c, cs) {
	for (var i = 0; i < cs.length; i++) {
		if (eq_cards(c, cs[i])) {
			return i;
		}
	}

	return -1;
}

function fail () {
	$.get('./fail');
}

function init () {
	function init1 () {
		var d = new $.Deferred();

		$.get( './init/1')
			.done( function (data) {
					room = {
						p      : bigint(data.p),
						q      : bigint(data.q),
						alpha  : bigint(data.alpha),
						beta_i : bigint(data.beta),
						x      : data.x.map(  function (e) { return bigint(e); } ),
						cards  : [],
						drawn  : [],
					};
					var key = odd_random(room.q);

					me = {
						key  : key,
						beta : room.alpha.modPow(key, room.p)
					};

					room.beta = room.beta_i.modPow(key, room.p);

					d.resolve(me, room);
				});

		return d.promise();
	}

	function init2 (me, room) {
		var d = new $.Deferred();

		$.post( './init/2', { beta_i : jsonify(me.beta), beta : jsonify(room.beta) } )
			.done( function (data) {
				room.c0 = data.map(card_of_string);

				d.resolve(me, room);
			});

		return d.promise();
	}

	var d = new $.Deferred();

	init1().then(init2).done( function (me, room) {
		d.resolve(me, room)
	});

	return d.promise();
}

function suffle (me, room) {
	function shuffle1 (ci_1, ci, ri, pii) {
		var d = new $.Deferred();

		var c = range(numbers.s).map( function () { return procedure_32(ci, room.p, room.q); } );

		$.post( './shuffle/1', {
				c1   : jsonify(ci),
				c1_k : jsonify(c.map( function (x) { return x[0]; } )),
			})
			.done( function (m) {
				d.resolve(ci_1, ci, ri, pii, c, m);
			});
		
		return d.promise();
	}

	function shuffle2 (ci_1, ci, ri, pii, c, m) {
		var d = new $.Deferred();

		var p = m.map( function (u, i) {
				var r_ik = c[i][1], pi_ik = c[i][2];

				if (u) {
					return [r_ik, pi_ik];
				} else {
					var pi_ = compose(pi_ik, pii);
					var r_  = permute(
							inverse(pi_),
							range(numbers.cards).map( function (j) {
									return ri[pi_[j]].multiply(r_ik[pi_ik[j]]);
								})
						);

					return [r_, pi_];
				}
			} );
		
		$.post( './shuffle/2', { q : jsonify(p) } ).done(
			function (c) {
				var ci_ = c.c_i.map(card_of_string);

				d.resolve(ci, ci_, c.c_ik)
			});

		return d.promise();
	}

	function shuffle3 (ci_1, ci, c_ik) {
		var d  = new $.Deferred();
		var m  = mask();

		$.post( './shuffle/3', { m : jsonify(m) }).done(
			function (c) {
				m.every( function (x, i) {
						var r     = c[i][0].map( function (x) { return bigint(x); } );
						var pi    = c[i][1].map( function (x) { return Number(x); } );
						var c_ik_ = c_ik[i].map( card_of_string );

						if ( r.some(function (e) { return e.isEven(); }) ) {
							d.reject('wrong R!');
						}

						return x ?
							procedure_33 (ci,  c_ik_, r, pi, room.p) :
							procedure_33 (ci_1, c_ik_, r, pi, room.p);
					}) ? d.resolve(ci) : d.reject('error in make_mask');
			});

		return d.promise();
	}

	var d = new $.Deferred();
	var t = procedure_32(room.c0, room.p, room.q);
	var ci = t[0], ri = t[1], pii = t[2];

	shuffle1(room.c0, ci, ri, pii, room.p, room.q)
		.then(shuffle2)
		.then(shuffle3)
		.then( function (ci) {
				room.cards = ci;

				d.resolve(me, room);
			});
	
	return d.promise();
}

function cp_prove (c_card, me, room) {
	function prove1 (c_card) {
		var d = new $.Deferred();

		var m_card = [c_card[0], c_card[1].modPow(me.key.modInverse(room.q), room.p)];
		var s = random(room.p);
		var a = room.alpha.modPow(s, room.p);
		var b = m_card[1].modPow(s, room.p);
	
		$.post( './cp/verify/1', { m_card : jsonify(m_card), a : jsonify(a), b : jsonify(b) })
			.done( function (c) {
				d.resolve(m_card, s, bigint(c));
			});

		return d.promise();
	}

	function prove2 (c_card, s, c) {
		var d = new $.Deferred();
		var r = s.add(c.multiply(me.key));
		
		$.post( './cp/verify/2', { r : jsonify(r) })
			.done( function (card) {
				var m_card = card_of_string(card);

				d.resolve(c_card, m_card, me, room);
			});

		return d.promise();
	}

	return prove1(c_card).then(prove2);
}

function cp_verify (c_card, m_card, me, room) {
	function verify1 () {
		var d = new $.Deferred();

		$.get( './cp/prove/1', function (data) {
				var a = bigint(data.a);
				var b = bigint(data.b);

				d.resolve(a, b);
			})

		return d.promise();
	}

	function verify2 (a, b) {
		var d = new $.Deferred();
		var c = random(room.q);

		$.post( './cp/prove/2', { c : jsonify(c) } )
			.done( function (r) {
				r = bigint(r);

				if (cp_proof(room.alpha, room.beta_i, m_card[1], c_card[1], c, r, a, b, room.p)) {
					room.drawn.push(get_card(m_card, room.x, room.p));
					d.resolve(me, room);
				} else {
					d.reject('cp verify error');
				}
			});

		return d.promise();
	}

	return verify1().then(verify2);
}

function change_ui (me, room) {
	var n = room.drawn[room.drawn.length - 1];
	$('#drawn_cards_' + win).append(
		$('<li>').append(
				$('<div>').addClass('card ' + suits[win] + ' rank-' + symbols[n]).append(
					$('<span>').addClass('rank').text(symbols[n].toUpperCase()),
					$('<span>').addClass('suit').html('&' + suits[win] + ';'))));

	$('#left_cards_' + win + ' li:first').remove();
	
	if (flag !== undefined) {
		$('#flag').append(
			$('<div>').addClass('alert alert-success')
					  .attr( {role : 'alert'} )
					  .text('Congratulations! ' + flag));

		$('#reset_button').attr( {disabled : 'disabled'} );

		$('#deck_area').remove();
	}

	return this;
}

function begin (me, room) {
	var d = new $.Deferred();

	function first () {
		var d = new $.Deferred();

		$.get( './begin', function (card) {
				var c_card = card_of_string(card);

				var i = index_of_card(c_card, room.cards);
				if (i > -1) {
					room.cards = extracted_cards(i, room.cards);

					d.resolve(c_card, me, room);
				} else {
					d.reject('this card does not exist');
				}
			});
		
		return d.promise();
	}
	
	return first()
			.then(cp_prove)
			.then(cp_verify)
			.then(change_ui);
}

function next (me, room) {
	var d = new $.Deferred();

	$.get( './next', function (card) {
			var card = card_of_string(card);
			var i    = index_of_card(card, room.cards);
	
			if (i > -1) {
				room.cards = extracted_cards(i, room.cards);

				$('.choice').removeAttr('disabled');

				me['c_card'] = card;
				d.resolve(card, me, room);
			} else {
				d.reject('this card does not exist in c0.');
			}
		})
	
	return d.promise();
}

function choose (c_card, me, room) {
	var d = new $.Deferred();

	$('.choice').click( function (e) {
		$('.choice').unbind();
		$('.choice').attr( {disabled : 'disabled'} );

		$.post("./choose", { choice : $(this).val() }).done(
			function () {
				d.resolve(c_card, me, room);
			});
	});

	return d.promise();
}

function check (me, room) {
	var d = new $.Deferred();

	$.get('./check', function (data) {
			if (data === 'ok') {
				d.resolve(me, room);
			} else if (data === 'miss') {
				d.reject(me, room);
			} else {
				flag = data;
				d.resolve(me, room);
			}
		});
	
	return d.promise();
}

function miss (me, room) {
	var n = room.drawn[room.drawn.length - 1];

	$('#drawn_cards_' + win).append(
		$('<li>').append(
			$('<strong>').append(
				$('<div>').addClass('card ' + suits[win] + ' rank-' + symbols[n]).append(
					$('<span>').addClass('rank').text(symbols[n].toUpperCase()),
					$('<span>').addClass('suit').html('&' + suits[win] + ';')))));


	$('#left_cards_' + win + ' li:first').remove();

	$('#reset_button').unbind();
	$('#reset_button').click( function (e) {
			location.reload();
		});

	return this;
}

function play (me, room) {
	return room.drawn.length < numbers.cards ?
			next(me, room).then(choose)
						  .then(cp_prove)
						  .then(cp_verify)
						  .then(check)
						  .then(change_ui, miss)
						  .then(play) : undefined;
}

function newgame () {
	return flag === undefined ?
		init().then(suffle)
			  .then(begin)
			  .then(play)
			  .fail(fail)
			  .then(function () {
			  	win++;
			  })
			  .then(newgame) : undefined;
}

newgame();
