    const { body, validationResult } = require('express-validator');


    const validateRegistration = (req, res, next) => {
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    next()
    }

    const validateLogin = (req, res, next) => {
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    next()
    }

    const validateAddress = (req, res, next) => {
        const errors=validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }
        next()
        }
    const RegiseterUserValidationRule=[
        body("username")
        .isLength({ min: 3, max: 20 }).
        withMessage("Username must be between 3 and 20 characters")
        .isString()
        .withMessage("Username must be a string"),
        body("email")
        .isEmail()
        .withMessage("Invalid email format"),
        body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long")
        ,validateRegistration
    ]

    const validateLoginRule=[
        body("email")
        .optional()
        .isEmail()
        .withMessage("Invalid email format")
        ,
        body("username")
        .optional()
        .isString()
        .withMessage("Username must be a string"),
        body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long"),
        validateLogin

    ]

    const validateAddressRule=[
        body("street")
        .isString()
        .withMessage("Street must be a string"),
        body("city")
        .isString()
        .withMessage("City must be a string"),
        body("state")
        .isString()
        .withMessage("State must be a string"),
        body("zipCode")
        .notEmpty()
        .withMessage("Zip code is required")
    .isString()
    .withMessage("Zip code must be a string"),
    body("country")      
        .isString()
        .withMessage("Country must be a string"),
        validateAddress
        
    ]
    module.exports={RegiseterUserValidationRule, validateLoginRule, validateAddressRule}