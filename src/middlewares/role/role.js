const roleMiddleware = (roles = []) => (req, res, next) => {
    try {
        if (!req.user) {
            console.log('Role check failed: No user in request');
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required' 
            });
        }
        
        if (!req.user.role) {
            console.log('Role check failed: No role assigned to user');
            return res.status(403).json({ 
                success: false,
                message: 'Access denied: No role assigned' 
            });
        }
        
        if (roles.length > 0 && !roles.includes(req.user.role)) {
            console.log(`Role check failed: User role '${req.user.role}' not in allowed roles [${roles.join(', ')}]`);
            return res.status(403).json({ 
                success: false,
                message: 'Access denied: Insufficient permissions' 
            });
        }
        
        next();
    } catch (error) {
        console.error('Role middleware error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
};

module.exports = roleMiddleware;