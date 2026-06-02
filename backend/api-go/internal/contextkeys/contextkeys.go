package contextkeys

import "context"

type contextKey string

const UserIDKey = contextKey("user_id")
const EmailKey = contextKey("email")

func GetUserID(ctx context.Context) string {
	if v, ok := ctx.Value(UserIDKey).(string); ok {
		return v
	}
	return ""
}

func GetUserEmail(ctx context.Context) string {
	if v, ok := ctx.Value(EmailKey).(string); ok {
		return v
	}
	return ""
}
