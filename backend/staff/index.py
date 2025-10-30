'''
Business: API для управления сотрудниками - получение списка, создание, обновление, удаление
Args: event - dict с httpMethod, body, queryStringParameters, pathParams
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными сотрудников
'''
import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'GET':
            staff_id = event.get('queryStringParameters', {}).get('id')
            
            if staff_id:
                cur.execute(
                    "SELECT id, login, name, role, permissions, created_at, updated_at FROM staff WHERE id = %s",
                    (staff_id,)
                )
                row = cur.fetchone()
                if row:
                    result = {
                        'id': row[0],
                        'login': row[1],
                        'name': row[2],
                        'role': row[3],
                        'permissions': row[4],
                        'created_at': row[5].isoformat() if row[5] else None,
                        'updated_at': row[6].isoformat() if row[6] else None
                    }
                else:
                    result = None
            else:
                cur.execute(
                    "SELECT id, login, name, role, permissions, created_at, updated_at FROM staff ORDER BY created_at DESC"
                )
                rows = cur.fetchall()
                result = [{
                    'id': row[0],
                    'login': row[1],
                    'name': row[2],
                    'role': row[3],
                    'permissions': row[4],
                    'created_at': row[5].isoformat() if row[5] else None,
                    'updated_at': row[6].isoformat() if row[6] else None
                } for row in rows]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            login = body.get('login')
            password = body.get('password')
            name = body.get('name')
            role = body.get('role')
            permissions = body.get('permissions', {})
            
            if not all([login, password, name, role]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "INSERT INTO staff (login, password, name, role, permissions) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (login, password, name, role, json.dumps(permissions))
            )
            staff_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': staff_id, 'message': 'Staff created'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            staff_id = body.get('id')
            
            if not staff_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing staff id'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            update_fields = []
            params = []
            
            if 'login' in body:
                update_fields.append("login = %s")
                params.append(body['login'])
            if 'password' in body:
                update_fields.append("password = %s")
                params.append(body['password'])
            if 'name' in body:
                update_fields.append("name = %s")
                params.append(body['name'])
            if 'role' in body:
                update_fields.append("role = %s")
                params.append(body['role'])
            if 'permissions' in body:
                update_fields.append("permissions = %s")
                params.append(json.dumps(body['permissions']))
            
            if update_fields:
                update_fields.append("updated_at = CURRENT_TIMESTAMP")
                params.append(staff_id)
                
                query = f"UPDATE staff SET {', '.join(update_fields)} WHERE id = %s"
                cur.execute(query, tuple(params))
                conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Staff updated'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}, ensure_ascii=False),
            'isBase64Encoded': False
        }
