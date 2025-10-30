'''
Business: API для управления задачами Jira - создание всеми, обработка только Супер админ и ОКК
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с данными задач
'''
import json
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            task_id = params.get('id')
            status = params.get('status')
            assigned_to = params.get('assigned_to')
            
            if task_id:
                cur.execute(
                    '''SELECT t.id, t.title, t.description, t.priority, t.status,
                       t.created_by, s1.name as creator_name,
                       t.assigned_to, s2.name as assignee_name,
                       t.created_at, t.updated_at, t.due_date, t.resolution_comment
                       FROM t_p77168343_support_chat_project.jira_tasks t
                       LEFT JOIN t_p77168343_support_chat_project.staff s1 ON t.created_by = s1.id
                       LEFT JOIN t_p77168343_support_chat_project.staff s2 ON t.assigned_to = s2.id
                       WHERE t.id = %s''',
                    (task_id,)
                )
                row = cur.fetchone()
                result = {
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'priority': row[3],
                    'status': row[4],
                    'created_by': row[5],
                    'creator_name': row[6],
                    'assigned_to': row[7],
                    'assignee_name': row[8],
                    'created_at': row[9].isoformat() if row[9] else None,
                    'updated_at': row[10].isoformat() if row[10] else None,
                    'due_date': row[11].isoformat() if row[11] else None,
                    'resolution_comment': row[12]
                } if row else None
            else:
                query = '''SELECT t.id, t.title, t.description, t.priority, t.status,
                           t.created_by, s1.name as creator_name,
                           t.assigned_to, s2.name as assignee_name,
                           t.created_at, t.updated_at, t.due_date
                           FROM t_p77168343_support_chat_project.jira_tasks t
                           LEFT JOIN t_p77168343_support_chat_project.staff s1 ON t.created_by = s1.id
                           LEFT JOIN t_p77168343_support_chat_project.staff s2 ON t.assigned_to = s2.id
                           WHERE 1=1'''
                query_params = []
                
                if status:
                    query += ' AND t.status = %s'
                    query_params.append(status)
                
                if assigned_to:
                    query += ' AND t.assigned_to = %s'
                    query_params.append(int(assigned_to))
                
                query += ' ORDER BY t.created_at DESC'
                
                cur.execute(query, tuple(query_params))
                rows = cur.fetchall()
                result = [{
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'priority': row[3],
                    'status': row[4],
                    'created_by': row[5],
                    'creator_name': row[6],
                    'assigned_to': row[7],
                    'assignee_name': row[8],
                    'created_at': row[9].isoformat() if row[9] else None,
                    'updated_at': row[10].isoformat() if row[10] else None,
                    'due_date': row[11].isoformat() if row[11] else None
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
            title = body.get('title')
            description = body.get('description', '')
            priority = body.get('priority', 'medium')
            created_by = body.get('created_by')
            due_date = body.get('due_date')
            
            if not all([title, created_by]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                '''INSERT INTO t_p77168343_support_chat_project.jira_tasks
                   (title, description, priority, created_by, due_date, status)
                   VALUES (%s, %s, %s, %s, %s, 'new')
                   RETURNING id''',
                (title, description, priority, created_by, due_date)
            )
            task_id = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': task_id, 'message': 'Task created'}, ensure_ascii=False),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            task_id = body.get('id')
            status = body.get('status')
            assigned_to = body.get('assigned_to')
            resolution_comment = body.get('resolution_comment')
            
            if not task_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing task ID'}, ensure_ascii=False),
                    'isBase64Encoded': False
                }
            
            updates = []
            params = []
            
            if status:
                updates.append('status = %s')
                params.append(status)
            
            if assigned_to is not None:
                updates.append('assigned_to = %s')
                params.append(assigned_to if assigned_to else None)
            
            if resolution_comment:
                updates.append('resolution_comment = %s')
                params.append(resolution_comment)
            
            updates.append('updated_at = CURRENT_TIMESTAMP')
            params.append(task_id)
            
            query = f'''UPDATE t_p77168343_support_chat_project.jira_tasks 
                        SET {', '.join(updates)} 
                        WHERE id = %s'''
            
            cur.execute(query, tuple(params))
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Task updated'}, ensure_ascii=False),
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
