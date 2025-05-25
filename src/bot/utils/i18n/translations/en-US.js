// src/bot/utils/i18n/translations/en-US.js

export const enUS = {
    common: {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Information',
        loading: 'Loading...',
        confirm: 'Confirm',
        cancel: 'Cancel',
        yes: 'Yes',
        no: 'No',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        page: 'Page {current}/{total}',
        timeFormat: 'MM/DD/YYYY HH:mm:ss',
        noData: 'No data available',
        notFound: 'Not found',
        unauthorized: 'You are not authorized to perform this action',
        timeRemaining: 'Time remaining: {time}'
    },
    player: {
        start: {
            alreadyRegistered: 'You are already registered! Use /player profile to view your profile.',
            success: 'Character created successfully! Welcome to the MAII economic system!',
            initialMoney: 'Initial funds: ${money}',
            newAccount: 'This is a new account!',
            occupation: 'Occupation: {occupation}'
        },
        profile: {
            title: '{username}\'s Profile',
            money: '💰 Money',
            enterprises: '💼 Enterprises',
            gameTime: '🕒 Game Time',
            occupation: '👨‍💼 Occupation',
            achievements: '🏆 Achievements',
            privateProfile: 'This user\'s profile is private',
            notInitialized: 'This user has not initialized their character yet',
            customFields: 'Custom Fields'
        },
        privacy: {
            updated: 'Privacy settings updated',
            status: 'Current status: {status}',
            public: 'Public',
            private: 'Private'
        },
        help: {
            title: 'Player Commands Help',
            description: 'Here are the available player commands:',
            start: '`/player start` - Create your character',
            profile: '`/player profile [user]` - View character profile',
            privacy: '`/player privacy` - Set privacy options'
        }
    },
    enterprise: {
        create: {
            success: 'Enterprise created successfully!',
            name: 'Enterprise name: {name}',
            type: 'Enterprise type: {type}',
            cost: 'Creation cost: ${cost}',
            cooldown: 'Entrepreneurship cooldown: {time}',
            insufficientFunds: 'Insufficient funds! Creating an enterprise requires ${cost}',
            cooldownActive: 'You are in an entrepreneurship cooldown. You need to wait {time} before creating another enterprise',
            typeSelection: 'Please select an enterprise type:',
            namePrompt: 'Please enter an enterprise name:',
            confirmCreate: 'Confirm creating a {type} type enterprise named "{name}"? This will cost ${cost}',
            enterpriseLimit: 'You have reached the enterprise limit ({limit})!'
        },
        types: {
            farm: 'Farm',
            factory: 'Factory',
            restaurant: 'Restaurant',
            store: 'Store',
            tech: 'Tech Company',
            finance: 'Financial Institution'
        },
        manage: {
            title: '{name} Management Panel',
            revenue: 'Revenue: ${amount}',
            expenses: 'Expenses: ${amount}',
            profit: 'Profit: ${amount}',
            staff: 'Staff: {count}',
            level: 'Level: {level}',
            upgrade: 'Upgrade',
            hire: 'Hire',
            market: 'Market',
            notFound: 'Could not find your enterprise. Please check the enterprise ID or name'
        }
    },
    admin: {
        reset: {
            confirmUser: 'Are you sure you want to reset {username}\'s data? This action cannot be undone!',
            success: 'Successfully reset {username}\'s data',
            notFound: 'User not found',
            unauthorized: 'You are not authorized to perform this action'
        },
        sync: {
            start: 'Starting data synchronization...',
            complete: 'Data synchronization complete! Processed {count} records',
            inProgress: 'Synchronization in progress... ({current}/{total})',
            scheduled: 'Scheduled synchronization set for {time}',
            unauthorized: 'You are not authorized to perform this action'
        }
    },
    errors: {
        generic: 'An error occurred, please try again later',
        database: 'Database error',
        notFound: 'Resource not found',
        invalidInput: 'Invalid input',
        permissionDenied: 'Permission denied',
        cooldownActive: 'Command on cooldown, please wait {time}',
        notInitialized: 'You have not initialized your character yet. Please use the /player start command',
        alreadyExists: 'Data already exists',
        notEnoughMoney: 'Not enough money',
        networkError: 'Network error, please try again later'
    }
};
