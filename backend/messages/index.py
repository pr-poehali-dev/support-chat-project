'''
Business: API для работы с сообщениями в чатах - получение и добавление сообщений
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными сообщений
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            chat_id = params.get('chat_id')
            
            if not chat_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'chat_id required'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                '''SELECT id, chat_id, sender_type, sender_name, content, created_at
                   FROM t_p77168343_support_chat_project.messages 
                   WHERE chat_id = %s 
                   ORDER BY created_at ASC''',
                (chat_id,)
            )
            rows = cur.fetchall()
            
            result = [{
                'id': row[0],
                'chat_id': row[1],
                'sender_type': row[2],
                'sender_name': row[3],
                'content': row[4],
                'created_at': row[5].isoformat() if row[5] else None
            } for row in rows]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps(result, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            chat_id = body.get('chat_id')
            sender_type = body.get('sender_type')
            sender_name = body.get('sender_name')
            content = body.get('content')
            sender_id = body.get('sender_id')
            
            if not all([chat_id, sender_type, content]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                '''INSERT INTO t_p77168343_support_chat_project.messages 
                   (chat_id, sender_type, sender_name, sender_id, content, created_at)
                   VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP) 
                   RETURNING id''',
                (chat_id, sender_type, sender_name, sender_id, content)
            )
            message_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': message_id, 'message': 'Message sent'}, ensure_ascii=False),
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
