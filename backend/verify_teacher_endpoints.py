import json
import urllib.request

base = 'http://127.0.0.1:8000/api/v1'

req = urllib.request.Request(
    base + '/auth/login',
    data=json.dumps({'email': 'kalam@gmail.com', 'password': 'admin@1230'}).encode(),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req) as r:
    body = json.load(r)
    token = body['access_token']
    print('LOGIN_OK', token[:20])

for path in ['/subjects', '/subjects/all', '/analytics/teacher']:
    req = urllib.request.Request(base + path, headers={'Authorization': 'Bearer ' + token})
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read().decode()
            print('PATH', path, 'STATUS', r.status)
            print(body[:2000])
            print('---')
    except Exception as e:
        print('PATH', path, 'ERROR', e)
