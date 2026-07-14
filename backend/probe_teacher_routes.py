import json
import urllib.request
import urllib.error

base = 'http://127.0.0.1:8000/api/v1'

login_req = urllib.request.Request(
    base + '/auth/login',
    data=json.dumps({'email': 'superadmin@admin.com', 'password': 'admin@1230'}).encode(),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(login_req) as r:
    token = json.load(r)['access_token']

for path in ['/subjects', '/subjects/all', '/analytics/teacher']:
    req = urllib.request.Request(base + path, headers={'Authorization': 'Bearer ' + token})
    try:
        with urllib.request.urlopen(req) as r:
            print(path, r.status)
            print(r.read().decode()[:4000])
            print('---')
    except urllib.error.HTTPError as e:
        print(path, 'HTTP', e.code)
        print(e.read().decode()[:4000])
        print('---')
