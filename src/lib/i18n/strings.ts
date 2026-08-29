import type { Language } from '@/types'

export const strings: Record<Language, Record<string, string>> = {
  en: {
    // Common
    app_name: 'BrainBuddy',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    close: 'Close',
    
    // Auth
    login: 'Login',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    login_button: 'Sign In',
    register_button: 'Create Account',
    
    // Patient Home
    welcome: 'Welcome',
    start_activity: "Start Today's Activity",
    my_memories: 'My Memories',
    my_reminders: 'My Reminders',
    hear_again: 'Hear Again',
    
    // Games
    memory_game: 'Memory Game',
    pattern_game: 'Pattern Game',
    start_game: 'Start Game',
    game_over: 'Game Complete!',
    score: 'Score',
    accuracy: 'Accuracy',
    time: 'Time',
    hints_used: 'Hints Used',
    well_done: 'Well Done!',
    try_again: 'Try Again',
    
    // Memory Game Specific
    remember_objects: 'Remember these objects',
    select_remembered: 'Select the objects you remember',
    objects_shown: 'objects shown',
    objects_correct: 'correct',
    
    // Pattern Game Specific
    what_comes_next: 'What comes next?',
    select_next: 'Select the next item in the pattern',
    pattern_complete: 'Pattern Complete!',
    
    // Reminders
    reminders: 'Reminders',
    no_reminders: 'No reminders yet',
    medicine: 'Medicine',
    hydration: 'Hydration',
    activity: 'Activity',
    taken: 'Taken',
    done: 'Done',
    remind_later: 'Remind Later',
    add_reminder: 'Add Reminder',
    
    // Memory Book
    memory_book: 'Memory Book',
    no_memories: 'No memories yet',
    add_memory: 'Add Memory',
    name: 'Name',
    relationship: 'Relationship',
    description: 'Description',
    photo: 'Photo',
    
    // Caregiver Dashboard
    dashboard: 'Dashboard',
    patient_details: 'Patient Details',
    recent_activity: 'Recent Activity',
    performance_trends: 'Performance Trends',
    today_activities: "Today's Activities",
    memory_performance: 'Memory Performance',
    attention_performance: 'Attention Performance',
    reminder_completion: 'Reminder Completion',
    
    // System States
    online: 'Online',
    offline: 'Offline',
    syncing: 'Syncing...',
    sync_complete: 'Sync Complete',
    no_data: 'No data yet',
    
    // Language Selection
    select_language: 'Select Language',
    english: 'English',
    assamese: 'Assamese',
    
    // Accessibility
    voice_instruction: 'Voice Instruction',
    replay: 'Replay',
    
    // Role Selection
    select_role: 'Select your role',
    i_am_patient: "I'm a Patient",
    i_am_caregiver: "I'm a Caregiver",
  },
  as: {
    // Common
    app_name: '\u09B0\u09C7\u0995\u09A8 \u09A6\u09BF\u09AF\u09BC\u09B8\u09BE \u09B9\u09C7\u09B2\u09C7\u0995\u09A4\u09CD\u09A4\u09BE\u09B0',
    loading: '\u09B2\u09A1 \u09B9\u09C8 \u0986\u099B\u09C7...',
    error: '\u09A4\u09CD\u09B0\u09C1\u099F\u09BF',
    retry: '\u09AA\u09C1\u09A8\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u0995',
    save: '\u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3 \u0995\u09B0\u0995',
    cancel: '\u09AC\u09BE\u09A4\u09BF\u09B2 \u0995\u09B0\u0995',
    delete: '\u09AE\u099A\u09BF \u09AA\u09C7\u09B2\u09BE\u0993\u0995',
    edit: '\u09B8\u09AE\u09CD\u09AA\u09BE\u09A6\u09A8\u09BE \u0995\u09B0\u0995',
    back: '\u09AA\u09BF\u099B\u09B2\u09A4\u09C7',
    next: '\u09AA\u09B0\u09B5\u09B0\u09CD\u09A4\u09C0',
    finish: '\u09B8\u09AE\u09BE\u09AA\u09CD\u09A4',
    close: '\u09AC\u09A8\u09CD\u09A7 \u0995\u09B0\u0995',
    
    // Auth
    login: '\u09B2\u0997\u09BF\u09A8',
    logout: '\u09B2\u0997\u0986\u0989\u099F',
    email: '\u0987\u09AE\u09C7\u0987\u09B2',
    password: '\u09AA\u09BE\u09B8\u09C1\u09A1',
    login_button: '\u09B8\u09BE\u0987\u09A8 \u0987\u09A8',
    register_button: '\u098F\u0995\u09BE\u0993\u09A3\u09CD\u099F \u09B8\u09C3\u09B7\u09CD\u099F\u09BF \u0995\u09B0\u0995',
    
    // Patient Home
    welcome: '\u09B8\u09CD\u09B5\u09BE\u0997\u09A4\u09AE',
    start_activity: '\u0986\u099C\u09BF\u09B0 \u0995\u09BE\u09B0\u09CD\u09AF \u0986\u09B0\u09AE\u09CD\u09AD \u0995\u09B0\u0995',
    my_memories: '\u09AE\u09CB\u09B0 \u09B8\u09AE\u09CD\u099D\u09CB\u09B5\u09BE',
    my_reminders: '\u09AE\u09CB\u09B0 \u09B8\u09CB\u09AE\u09CD\u09B5\u09BE\u09A8\u09BF',
    hear_again: '\u0986\u0995\u09CC \u09B6\u09C1\u09A8\u0995',
    
    // Games
    memory_game: '\u09B8\u09AE\u09CD\u099D\u09CB\u09B5\u09BE \u0996\u09C7\u09B2',
    pattern_game: '\u09AA\u09C7\u099F\u09BE\u09B0\u09CD\u09A8 \u0996\u09C7\u09B2',
    start_game: '\u0996\u09C7\u09B2 \u0986\u09B0\u09AE\u09CD\u09AD \u0995\u09B0\u0995',
    game_over: '\u0996\u09C7\u09B2 \u09B8\u09AE\u09BE\u09AA\u09CD\u09A4!',
    score: '\u09B8\u09CD\u0995\u09B0',
    accuracy: '\u09B6\u09C1\u09A6\u09CD\u09A7\u09A4\u09BE',
    time: '\u09B8\u09AE\u09AF\u09BC',
    hints_used: '\u09AC\u09CD\u09AF\u09B9\u09C7\u09A4\u09BE \u0995\u09B0\u09BE \u0987\u0999\u09CD\u0997\u09BF\u09A4',
    well_done: '\u09AC\u09B9\u09C1 \u09AD\u09BE\u09B2!',
    try_again: '\u09AA\u09C1\u09A8\u09B0 \u099A\u09C7\u09B7\u09CD\u099F\u09BE \u0995\u09B0\u0995',
    
    // Memory Game Specific
    remember_objects: '\u098F\u0987 \u09AC\u09B8\u09CD\u09A4\u09C1\u09AC\u09CB\u09B0 \u09AE\u09A8\u09A4 \u0995\u09B0\u09BF \u09A5\u09BE\u0995\u0995',
    select_remembered: '\u0986\u09AA\u09C1\u09A8\u09BF \u09AE\u09A8\u09A4 \u0995\u09B0\u09BF \u09A5\u09BE\u0995\u09BE \u09AC\u09B8\u09CD\u09A4\u09C1\u09AC\u09CB\u09B0 \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09A8 \u0995\u09B0\u0995',
    objects_shown: '\u09AC\u09B8\u09CD\u09A4\u09C1 \u09A6\u09C7\u0996\u09C1\u0993\u0993\u09AF\u09BC\u09BE \u09B9\u09C8\u09B8\u09C7',
    objects_correct: '\u09B6\u09C1\u09A6\u09CD\u09A7',
    
    // Pattern Game Specific
    what_comes_next: '\u09AA\u09B0\u09B5\u09B0\u09CD\u09A4\u09C0 \u0995\u09BF \u0986\u09B9\u09BF\u09AC?',
    select_next: '\u09AA\u09C7\u099F\u09BE\u09B0\u09CD\u09A8\u09B0 \u09AA\u09B0\u09B5\u09B0\u09CD\u09A4\u09C0 \u0986\u0987\u099F\u09C7\u09AE \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09A8 \u0995\u09B0\u0995',
    pattern_complete: '\u09AA\u09C7\u099F\u09BE\u09B0\u09CD\u09A8 \u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3!',
    
    // Reminders
    reminders: '\u09B8\u09CB\u09AE\u09CD\u09B5\u09BE\u09A8\u09BF',
    no_reminders: '\u09AF\u09C7\u09A4\u09BF\u09AF\u09BC \u09B8\u09CB\u09AE\u09CD\u09B5\u09BE\u09A8\u09BF \u09A8\u09BE\u0987',
    medicine: '\u0993\u09B7\u09C1\u09A7',
    hydration: '\u09AA\u09BE\u09A8\u09C0',
    activity: '\u0995\u09BE\u09B0\u09CD\u09AF',
    taken: '\u09B2\u0993\u09B2',
    done: '\u09B9\u0995\u09B2',
    remind_later: '\u09AA\u09BF\u099B\u09A4 \u09B8\u09CB\u09AE\u09CD\u09B5\u09BE\u09A8\u09BF \u09A6\u09BF\u09AF\u09BC\u0995',
    add_reminder: '\u09B8\u09CB\u09AE\u09CD\u09B5\u09BE\u09A8\u09BF \u09AF\u09C7\u0995 \u0995\u09B0\u0995',
    
    // Memory Book
    memory_book: '\u09B8\u09AE\u09CD\u099D\u09CB\u09B5\u09BE \u09AC\u09B9\u09C0',
    no_memories: '\u09A4\u09B9\u09C7\u09A4\u09BF\u09AF\u09BC \u09B8\u09AE\u09CD\u099D\u09CB\u09B5\u09BE \u09A8\u09BE\u0987',
    add_memory: '\u09B8\u09AE\u09CD\u099D\u09CB\u09B5\u09BE \u09AF\u09C7\u0995 \u0995\u09B0\u0995',
    name: '\u09A8\u09BE\u09AE',
    relationship: '\u09B8\u09AE\u09CD\u09AA\u09B0\u09CD\u0995',
    description: '\u09AC\u09BF\u09B5\u09B0\u09A3',
    photo: '\u09AB\u099B\u099F\u09B0',
    
    // Caregiver Dashboard
    dashboard: '\u09A1\u09C7\u09B6\u09AC\u09B0\u09CD\u09A1',
    patient_details: '\u09B0\u09CB\u0997\u09C0\u09B0 \u09AC\u09BF\u09B5\u09B0\u09A3',
    recent_activity: '\u09B6\u09C7\u09B9\u09A4\u09C0\u09AF\u09BC\u09A6\u09B9 \u0995\u09BE\u09B0\u09CD\u09AF',
    performance_trends: '\u09A6\u0995\u09CD\u09B7\u09A4\u09BE\u09B0 \u09AA\u09CD\u09B0\u09AC\u09A3\u09A4\u09BE',
    today_activities: '\u0986\u099C\u09BF\u09B0 \u0995\u09BE\u09B0\u09CD\u09AF',
    memory_performance: '\u09B8\u09AE\u09CD\u099D\u09CB\u09B5\u09BE\u09B0 \u09A6\u0995\u09CD\u09B7\u09A4\u09BE',
    attention_performance: '\u09AE\u09A8\u09CB\u09AF\u09CB\u0997 \u09B0 \u09A6\u0995\u09CD\u09B7\u09A4\u09BE',
    reminder_completion: '\u09B8\u09CB\u09AE\u09CD\u09B5\u09BE\u09A8\u09BF \u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3',
    
    // System States
    online: '\u0985\u09A8\u09B2\u09BE\u0987\u09A8',
    offline: '\u0985\u09AB\u09B2\u09BE\u0987\u09A8',
    syncing: '\u099B\u09BF\u0999 \u09B9\u09C8 \u0986\u099B\u09C7...',
    sync_complete: '\u099B\u09BF\u0999 \u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3',
    no_data: '\u09A4\u09B9\u09C7\u09A4\u09BF\u09AF\u09BC \u09A4\u09A5\u09CD\u09AF \u09A8\u09BE\u0987',
    
    // Language Selection
    select_language: '\u09AD\u09BE\u09B7\u09BE \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09A8 \u0995\u09B0\u0995',
    english: '\u0987\u0982\u09B0\u09BE\u099C\u09C0',
    assamese: '\u0985\u09B8\u09AE\u09C0\u09AF\u09BC\u09BE',
    
    // Accessibility
    voice_instruction: '\u0995\u09A3\u09CD\u09A0 \u09A8\u09BF\u09B0\u09CD\u09A6\u09C7\u09B6\u09A8\u09BE',
    replay: '\u09AA\u09C1\u09A8\u09B0 \u099A\u09B2\u09BE\u0993\u0995',
    
    // Role Selection
    select_role: '\u0986\u09AA\u09C1\u09A8\u09BE\u09B0 \u09AD\u09C2\u09AE\u09BF\u0995\u09BE \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09A8 \u0995\u09B0\u0995',
    i_am_patient: '\u09AE\u09CB\u0987 \u09B0\u09CB\u0997\u09C0',
    i_am_caregiver: '\u09AE\u09CB\u0987 \u09AF\u09A4\u09CD\u09A8\u0995\u09B0\u09CD\u09A4\u09BE',
  }
}

export function getString(key: string, language: Language): string {
  return strings[language]?.[key] ?? strings.en[key] ?? key
}
