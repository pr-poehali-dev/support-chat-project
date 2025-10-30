'''
Business: API для управления чатами - получение активных/закрытых чатов, создание, обновление статуса
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными чатов и сообщений
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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
            params = event.get('queryStringParameters', {})
            status = params.get('status', 'active')
            chat_id = params.get('id')
            
            if chat_id:
                cur.execute(
                    '''SELECT c.id, c.client_name, c.client_phone, c.operator_id, 
                       s.name as operator_name, c.status, c.created_at, c.closed_at
                       FROM chats c
                       LEFT JOIN staff s ON c.operator_id = s.id
                       WHERE c.id = %s''',
                    (chat_id,)
                )
                row = cur.fetchone()
                
                if row:
                    cur.execute(
                        '''SELECT id, sender_type, sender_name, message_text, created_at 
                           FROM messages WHERE chat_id = %s ORDER BY created_at ASC''',
                        (chat_id,)
                    )
                    messages = cur.fetchall()
                    
                    result = {
                        'id': row[0],
                        'client_name': row[1],
                        'client_phone': row[2],
                        'operator_id': row[3],
                        'operator_name': row[4],
                        'status': row[5],
                        'created_at': row[6].isoformat() if row[6] else None,
                        'closed_at': row[7].isoformat() if row[7] else None,
                        'messages': [{
                            'id': msg[0],
                            'sender_type': msg[1],
                            'sender_name': msg[2],
                            'message_text': msg[3],
                            'created_at': msg[4].isoformat() if msg[4] else None
                        } for msg in messages]
                    }
                else:
                    result = None
            else:
                cur.execute(
                    '''SELECT c.id, c.client_name, c.client_phone, c.operator_id, 
                       s.name as operator_name, c.status, c.created_at, c.closed_at,
                       COUNT(m.id) as message_count
                       FROM chats c
                       LEFT JOIN staff s ON c.operator_id = s.id
                       LEFT JOIN messages m ON c.id = m.chat_id
                       WHERE c.status = %s
                       GROUP BY c.id, s.name
                       ORDER BY c.created_at DESC''',
                    (status,)
                )
                rows = cur.fetchall()
                result = [{
                    'id': row[0],
                    'client_name': row[1],
                    'client_phone': row[2],
                    'operator_id': row[3],
                    'operator_name': row[4],
                    'status': row[5],
                    'created_at': row[6].isoformat() if row[6] else None,
                    'closed_at': row[7].isoformat() if row[7] else None,
                    'message_count': row[8]
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
            client_name = body.get('client_name')
            client_phone = body.get('client_phone')
            operator_id = body.get('operator_id')
            message_text = body.get('message')
            
            if not all([client_name, client_phone]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "INSERT INTO chats (client_name, client_phone, operator_id) VALUES (%s, %s, %s) RETURNING id",
                (client_name, client_phone, operator_id)
            )
            chat_id = cur.fetchone()[0]
            
            if message_text:
                cur.execute(
                    "INSERT INTO messages (chat_id, sender_type, sender_name, message_text) VALUES (%s, %s, %s, %s)",
                    (chat_id, 'client', client_name, message_text)
                )
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': chat_id, 'message': 'Chat created'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            chat_id = body.get('id')
            
            if not chat_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing chat id'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            update_fields = []
            params = []
            
            if 'status' in body:
                update_fields.append("status = %s")
                params.append(body['status'])
                if body['status'] == 'closed':
                    update_fields.append("closed_at = CURRENT_TIMESTAMP")
            
            if 'operator_id' in body:
                update_fields.append("operator_id = %s")
                params.append(body['operator_id'])
            
            if update_fields:
                params.append(chat_id)
                query = f"UPDATE chats SET {', '.join(update_fields)} WHERE id = %s"
                cur.execute(query, tuple(params))
                conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Chat updated'}, ensure_ascii=False),
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
