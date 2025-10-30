'''
Business: API для управления оценками чатов - создание, получение оценок оператора
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными оценок
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
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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
            operator_id = params.get('operator_id')
            chat_id = params.get('chat_id')
            
            if chat_id:
                cur.execute(
                    '''SELECT r.id, r.chat_id, r.operator_id, r.rated_by, 
                       s.name as rater_name, r.score, r.comment, r.created_at,
                       c.client_name, c.client_phone
                       FROM chat_ratings r
                       LEFT JOIN staff s ON r.rated_by = s.id
                       LEFT JOIN chats c ON r.chat_id = c.id
                       WHERE r.chat_id = %s''',
                    (chat_id,)
                )
                row = cur.fetchone()
                result = {
                    'id': row[0],
                    'chat_id': row[1],
                    'operator_id': row[2],
                    'rated_by': row[3],
                    'rater_name': row[4],
                    'score': row[5],
                    'comment': row[6],
                    'created_at': row[7].isoformat() if row[7] else None,
                    'client_name': row[8],
                    'client_phone': row[9]
                } if row else None
            elif operator_id:
                cur.execute(
                    '''SELECT r.id, r.chat_id, r.operator_id, r.rated_by, 
                       s.name as rater_name, r.score, r.comment, r.created_at,
                       c.client_name, c.client_phone, c.created_at as chat_date
                       FROM chat_ratings r
                       LEFT JOIN staff s ON r.rated_by = s.id
                       LEFT JOIN chats c ON r.chat_id = c.id
                       WHERE r.operator_id = %s
                       ORDER BY r.created_at DESC''',
                    (operator_id,)
                )
                rows = cur.fetchall()
                result = [{
                    'id': row[0],
                    'chat_id': row[1],
                    'operator_id': row[2],
                    'rated_by': row[3],
                    'rater_name': row[4],
                    'score': row[5],
                    'comment': row[6],
                    'created_at': row[7].isoformat() if row[7] else None,
                    'client_name': row[8],
                    'client_phone': row[9],
                    'chat_date': row[10].isoformat() if row[10] else None
                } for row in rows]
            else:
                cur.execute(
                    '''SELECT r.id, r.chat_id, r.operator_id, r.rated_by, 
                       s1.name as operator_name, s2.name as rater_name, 
                       r.score, r.comment, r.created_at
                       FROM chat_ratings r
                       LEFT JOIN staff s1 ON r.operator_id = s1.id
                       LEFT JOIN staff s2 ON r.rated_by = s2.id
                       ORDER BY r.created_at DESC'''
                )
                rows = cur.fetchall()
                result = [{
                    'id': row[0],
                    'chat_id': row[1],
                    'operator_id': row[2],
                    'rated_by': row[3],
                    'operator_name': row[4],
                    'rater_name': row[5],
                    'score': row[6],
                    'comment': row[7],
                    'created_at': row[8].isoformat() if row[8] else None
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
            chat_id = body.get('chat_id')
            operator_id = body.get('operator_id')
            rated_by = body.get('rated_by')
            score = body.get('score')
            comment = body.get('comment', '')
            
            if not all([chat_id, operator_id, rated_by, score is not None]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                '''SELECT id FROM chat_ratings WHERE chat_id = %s''',
                (chat_id,)
            )
            existing = cur.fetchone()
            
            if existing:
                cur.execute(
                    '''UPDATE chat_ratings 
                       SET score = %s, comment = %s, rated_by = %s, created_at = CURRENT_TIMESTAMP
                       WHERE chat_id = %s
                       RETURNING id''',
                    (score, comment, rated_by, chat_id)
                )
                rating_id = cur.fetchone()[0]
            else:
                cur.execute(
                    '''INSERT INTO chat_ratings (chat_id, operator_id, rated_by, score, comment)
                       VALUES (%s, %s, %s, %s, %s)
                       RETURNING id''',
                    (chat_id, operator_id, rated_by, score, comment)
                )
                rating_id = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': rating_id, 'message': 'Rating saved'}, ensure_ascii=False),
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
