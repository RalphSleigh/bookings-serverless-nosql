export const getLoginReminderText = data => {
    switch (data.recipient.source) {
        case 'google':
            return 'When logging in again make sure to log in with the same account using the Google button'
            break;
        case 'facebook':
            return 'When logging in again make sure to log in with the same account using the Facebook button'
            break;
        case 'microsoft':
            return 'When logging in again make sure to log in with the same account using the Microsoft button'
            break;
        case 'yahoo':
            return 'When logging in again make sure to log in with the same account using the Yahoo button'
            break;
        case 'apple':
            return 'When logging in again make sure to log in with the same account using the Apple button'
            break;
    }
}