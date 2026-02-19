class ApiResponse {
    constructor(statusCode, data , message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400; /*-- status code 400 se kam hone par success true hoga aur 400 ya usse zyada hone par success false hoga. */
    }
}                                               