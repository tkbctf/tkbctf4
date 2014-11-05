from bottle import request, route, app, view, get, post, run, response, static_file
from beaker.middleware import SessionMiddleware

from charm.toolbox.integergroup import IntegerGroupQ
from charm.core.math.integer    import toInt, integer, reduce

from pickle   import dumps, loads
from binascii import b2a_base64, a2b_base64

from functools import reduce as foldl

import json, random, re, math, cherrypy

numbers = {
    'cards' : 13,
    's'     : 10
}

session_opts = {
    'session.type': 'file',
    'session.cookie_expires': True,
    'session.data_dir': './data',
    'session.auto': True
}
app  = SessionMiddleware(app(), session_opts)
flag = 'R1ceSp1n5Th3W0rld!'
bit  = 256

def split(s):
    m, _ = (re.split(' mod ', s))[:2]
    return m

def toStr(n):
    if type(n) == integer:
        return str(toInt(n))
    else:
        return str(n)

def odd_random(group):
    while True:
        r = group.random()
        if not toInt(r) % 2 == 0:
            break
    return r

def map(f, o):
    if type(o) == tuple:
        return tuple([ map(f, e) for e in o ])
    elif type(o) == list:
        return [ map(f, e) for e in o ]
    elif type(o) == dict:
        return dict([ (l, map(f, v)) for l, v in o.items() ])
    else:
        return f(o)

def toBase64(x):
    return b2a_base64(dumps(x))

def fromBase64(x):
    return loads(a2b_base64(x))

def jsonToInteger(c, p = None):
    return  map(lambda x: (integer(int(x)) if p is None else integer(int(x), p)), json.loads(c))

def make_pi(n = numbers['cards']):
    a = list(range(n))
    i = n - 1

    while i > 0:
        j = math.floor(random.random() * (i + 1))
        tmp = a[i]
        a[i] = a[j]
        a[j] = tmp
        i = i - 1

    return a

def permute(pi, d):
    assert len(pi) == len(d)
    return [d[i] for i in pi]

def compose(pi2, pi1):
    assert len(pi1) == len(pi2)
    return [pi1[i] for i in pi2]

def inverse(pi):
    xs = [(pi[i], i) for i in range(len(pi))]
    return [x[1] for x in sorted(xs)]

def mask(s=numbers['s']):
    return [random.choice([True, False]) for _ in range(s)]

def procedure_32(c0, group):
    r = [ odd_random(group) for _ in range(len(c0)) ]
    c = [(x[0][0] ** x[1], x[0][1] ** x[1]) for x in zip(c0, r)]
    p = make_pi()
    assert len(p) == len(c0)
    return (permute(p, c), r, p)

def procedure_33(ca, cb, r, pi):
    def f(i):
        db_i, ab_i = cb[i]
        da_i, aa_i = ca[pi[i]]
        r_i        = r[pi[i]]
        return db_i == (da_i ** r_i) and ab_i == (aa_i ** r_i)

    return all( f(i) for i in range(numbers['cards']) )

def cp_proof(alpha, beta, er, er_1, c, r, a, b):
    return alpha ** r == a * (beta ** c) and er ** r == b * (er_1 ** c)

class Room:
    def __init__(self, s, b = True):
        self.s     = s
        self.group = IntegerGroupQ()

        if b and not self.s.get('p') is None and not self.s.get('q') is None:
            self.p = self.group.deserialize(fromBase64(self.s['p']))
            self.q = self.group.deserialize(fromBase64(self.s['q']))
            self.group.setparam(self.p, self.q)

    def state(self, s):
        self.set('state', s)
        self.save()
    
    def check(self, v):
        try:
            return self.get('state') == v
        except:
            print(v, self.s.get('state'))
            return False
    
    def get(self, n, f = None):
        if f is None:
            f = lambda x: self.group.deserialize(x) if type(x) == bytes else x

        return map( f, fromBase64(self.s.get(n)) )

    def set(self, n, v, f = None):
        if f is None:
            f = lambda x: self.group.serialize(x) if type(x) == integer else x

        self.s[n] = toBase64( map(f, v) )

    def save(self):
        self.s.save()

    def clear(self):
        self.s.clear()
        self.s.save()

@route('/')
@view('index.tmpl')
def index():
    return dict(cards=numbers['cards'], four=range(4))

@route('/init/1')
def init1():
    group = IntegerGroupQ()
    group.paramgen(bit)

    alpha = group.randomGen()
    key   = group.random()
    beta  = alpha ** key
    x     = [ odd_random(group) for _ in range(numbers['cards']) ]

    room = Room(request.environ.get('beaker.session'), False)

    try:
        room.get('win')
    except:
        room.set('win', 0)

    [room.set(n, v) for n, v in [('p', group.p), ('q', group.q), ('alpha', alpha), ('key', key), ('beta_i', beta), ('x', x)]]
    room.save()

    response.content_type = 'application/json'
    return json.dumps(map(toStr, {
        'p'     : group.p,
        'q'     : group.q,
        'alpha' : alpha,
        'beta'  : beta,
        'x'     : x,
    }))

@post('/init/2')
def init2():
    room = Room(request.environ.get('beaker.session'))

    alpha = room.get('alpha')
    x     = room.get('x')

    beta   = jsonToInteger(request.forms.get('beta'), room.p)
    beta_j = jsonToInteger(request.forms.get('beta_i'), room.p)

    c0    = [ (alpha ** x[i], beta) for i in range(numbers['cards']) ]

    room.set('beta', beta)
    room.set('beta_j', beta_j)
    room.set('c0', c0)

    room.save()

    response.content_type = 'application/json'
    return json.dumps(map(toStr, c0))


@post('/shuffle/1')
def shuffle1():
    room = Room(request.environ.get('beaker.session'))

    c1   = jsonToInteger(request.forms.get('c1'), room.p)
    c1_k = jsonToInteger(request.forms.get('c1_k'), room.p)
    m    = mask()

    room.set('c1', c1)
    room.set('c1_k', c1_k)
    room.set('mask', m)

    room.save()

    response.content_type = 'application/json'
    return json.dumps(m)

@post('/shuffle/2')
def shuffle2():
    room = Room(request.environ.get('beaker.session'))

    mask, c0, c1, c1_k = [room.get(x) for x in ['mask', 'c0', 'c1', 'c1_k']]

    d = json.loads(request.forms.get('q'))

    def f(i):
        r, pi = map(lambda x : jsonToInteger(x), d[i][0]), d[i][1]

        if all(toInt(x) % 2 != 0 for x in r):
            return procedure_33(c1, c1_k[i], r, pi) if mask[i] else procedure_33(c0, c1_k[i], r, pi)
        else:
            return False

    if not all( f(i) for i in range(numbers['s']) ):
        fail()
        return 'fail to verify c1'

    room.state('shuffle3');

    ci, ri, pii = procedure_32(c1, room.group)

    room.set('ci', ci)
    room.set('ri', ri)
    room.set('pii', pii)

    c_ik = [ procedure_32(ci, room.group) for _ in range(numbers['s']) ]
    
    room.set('c_ik', c_ik)

    room.save()

    response.content_type = 'application/json'
    return json.dumps(map(toStr, {
        'c_i'  : ci,
        'c_ik' : foldl(lambda x, y: x + [y[0]], c_ik, [])
        }))

@post('/shuffle/3')
def shuffle3():
    room = Room(request.environ.get('beaker.session'))
    
    if not room.check('shuffle3'):
        fail()
        return 'error'

    room.state('begin')

    m  = json.loads(request.forms.get('m'))

    ri, pii, c  = [ room.get(x) for x in ['ri', 'pii', 'c_ik'] ]
    
    def f(i):
        r_ik, pi_ik = c[i][1], c[i][2]
        
        if m[i]:
            return (r_ik, pi_ik)
        else:
            pi_ = compose(pi_ik, pii)
            r_  = permute( inverse(pi_), [ ri[pi_[j]] * r_ik[pi_ik[j]] for j in range(numbers['cards']) ] )

            return (r_, pi_)

    d = [ f(i) for i in range(numbers['s']) ]
    
    response.content_type = 'application/json'
    return json.dumps(map(toStr, d))

@get('/begin')
def begin():
    room = Room(request.environ.get('beaker.session'))
    
    if not room.check('begin'):
        fail()
        return 'error'

    cards = room.get('ci')

    i      = random.randint(0, len(cards) - 1)
    c_card = cards.pop(i) 


    room.set('turn', True)
    room.set('c_card', c_card)
    room.set('cards', cards)
    room.set('card', [])

    room.save()

    response.content_type = 'application/json'
    return json.dumps(map(toStr, c_card))

@post('/cp/verify/1')
def cp_verify_1():
    room = Room(request.environ.get('beaker.session'))

    c_card = room.get('c_card')
    m_card = jsonToInteger(request.forms.get('m_card'), room.p)
    a      = jsonToInteger(request.forms.get('a'), room.p)
    b      = jsonToInteger(request.forms.get('b'), room.p)

    c      = room.group.random()

    [room.set(n, v) for n, v in [('m_card', m_card), ('a', a), ('b', b), ('c', c)]]
    room.save()

    response.content_type = 'application/json'
    return json.dumps(toStr(c))

@post('/cp/verify/2')
def cp_verify_2():
    room = Room(request.environ.get('beaker.session'))

    alpha, beta_j, key = [ room.get(x) for x in ['alpha', 'beta_j', 'key'] ]
    x, c_card, m_card  = [ room.get(x) for x in ['x', 'c_card', 'm_card'] ]
    a, b, c            = [ room.get(x) for x in ['a', 'b', 'c'] ]

    r = jsonToInteger(request.forms.get('r'), room.p)

    if not cp_proof(alpha, beta_j, m_card[1], c_card[1], c, r, a, b):
        fail()
        return 'error'

    c_card = m_card
    m_card = [m_card[0], m_card[1] ** (key ** -1)]

    def get_card(c, d, xs):
        for x, i in zip(xs, range(len(xs))):
            if c ** x == d:
                return i
        return -1
        
    card = get_card(m_card[1], m_card[0], x)

    room.set('c_card', c_card)
    room.set('m_card', m_card)
    room.set('card', room.get('card') + [card])

    room.save()

    response.content_type = 'application/json'

    if card >= 0:
        room.state('verified')

        return json.dumps(map(toStr, m_card))
    else:
        fail()
        return 'error'

@get('/cp/prove/1')
def cp_prove_1():
    room = Room(request.environ.get('beaker.session'))
    
    if not room.check('verified'):
        fail()
        return 'error'

    s = room.group.random()
    a = room.get('alpha') ** s
    b = (room.get('m_card'))[1] ** s

    room.set('s', s)
    room.set('a', a)
    room.set('b', b)

    room.save()

    response.content_type = 'application/json'
    return json.dumps(map(toStr, {'a' : a, 'b' : b}))

@post('/cp/prove/2')
def cp_prove_2():
    room = Room(request.environ.get('beaker.session'))
    
    room.state('proved')

    s = toInt(room.get('s'))
    a = toInt(room.get('a'))
    b = toInt(room.get('b'))
    c = int(json.loads(request.forms.get('c')))

    r = s + c * toInt(room.get('key'))

    response.content_type = 'application/json'
    return json.dumps(map(toStr, r))

@get('/next')
def next():
    room = Room(request.environ.get('beaker.session'))

    if not ((room.check('next') or room.check('proved')) and room.get('turn')):
        fail()
        return 'error'

    cards  = room.get('cards')
    i      = random.randint(0, len(cards) - 1)
    c_card = cards.pop(i) 

    room.set('turn', False)
    room.set('c_card', c_card)
    room.set('cards', cards)

    room.save()
    
    response.content_type = 'application/json'
    return json.dumps(map(toStr, c_card))

@post('/choose')
def choose():
    room = Room(request.environ.get('beaker.session'))
    
    choice = request.forms.get('choice')
    
    if choice == 'low' or choice == 'high':
        room.set('choice', choice)
        room.save()

        return 'ok'
    else:
        fail()
        return 'error'

    
@get('/check')
def check():
    room = Room(request.environ.get('beaker.session'))

    if not room.check('proved'):
        fail()
        return 'error'

    a, b   = room.get('card')[-2:]
    choice = room.get('choice')
    cards  = room.get('cards')

    if (a > b and choice == 'low') or (a < b and choice == 'high'):
        room.set('turn', True)

        if len(cards) == 0:
            room.set('win', int(room.get('win')) + 1)

        room.state('next')
        room.save()

        if room.get('win') >= 4:
            room.clear()
            return 'FLAG{%s}' % flag
        else:
            return 'ok'
    else:
        fail()
        return 'miss'

@get('/fail')
def fail():
    room = Room(request.environ.get('beaker.session'))
    room.clear()

    return 'fail'

@route('/static/<path:path>')
def send_static(path):
    return static_file(path, root='./static/')

run(host='localhost', port=8080, app=app)
