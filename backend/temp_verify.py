import json, urllib.request
base='http://127.0.0.1:8000/api/v1'
req = urllib.request.Request(base + '/auth/login', data=json.dumps({'email':'superadmin@admin.com','password':'admin@1230'}).encode(), headers={'Content-Type':'application/json'})
with urllib.request.urlopen(req) as r:
    data = json.load(r)
token = data['access_token']
for path in ['/subjects', '/subjects/all', '/analytics/teacher']:
    req = urllib.request.Request(base + path, headers={'Authorization':'Bearer ' + token, 'Origin':'http://localhost:8080'})
    try:
        with urllib.request.urlopen(req) as r:
            body = r.read().decode()
            print(path, 'status', r.status)
            print(body[:500])
    except Exception as e:
        print(path, 'ERR', e)
        if hasattr(e, 'read'):
            print(e.read().decode())
