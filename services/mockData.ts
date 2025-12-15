import { Station, User, UserRole, StationRequest, FuelStatus, AvailabilityReportItem, OperatorActivityReportItem, PopularityReportItem, AppNotification, EmailLog } from '../types';
import { GoogleGenAI } from "@google/genai";

// ============================================================================
// SIMULATED DATABASE ENGINE (LOCAL STORAGE)
// ============================================================================

const STORAGE_KEYS = {
    USERS: 'fuelsoyo_db_users',
    STATIONS: 'fuelsoyo_db_stations',
    REQUESTS: 'fuelsoyo_db_requests',
    NOTIFICATIONS: 'fuelsoyo_db_notifications', // Log de e-mails/externas
    APP_NOTIFICATIONS: 'fuelsoyo_db_app_notifications' // Notificações internas (push)
};

// Soyo Base Coords: -6.1349, 12.3689

// --- Initial Seed Data (Only used if localStorage is empty) ---
const SEED_STATIONS: Station[] = [
  {
    id: '1',
    name: 'Posto Sonangol Central',
    address: 'Av. Principal, Centro, Soyo',
    phone: '+244 923 456 789',
    coords: { x: 45, y: 50 },
    location: { lat: -6.1349, lng: 12.3689 },
    status: { gasoline: true, diesel: true, lastUpdated: new Date().toISOString() },
    imageUrl: 'https://picsum.photos/id/111/800/400',
    stationCode: 'SONA001',
    openHours: '06:00 - 22:00',
    manager: 'João Manuel'
  },
  {
    id: '2',
    name: 'Posto Pumangol Norte',
    address: 'Rua do Comércio, Bairro Norte',
    phone: '+244 923 456 790',
    coords: { x: 60, y: 30 },
    location: { lat: -6.1250, lng: 12.3750 },
    status: { gasoline: false, diesel: true, lastUpdated: new Date(Date.now() - 3600000).toISOString() },
    imageUrl: 'https://picsum.photos/id/188/800/400',
    stationCode: 'PUMA002',
    openHours: '05:00 - 23:00',
    manager: 'Maria António'
  },
  {
    id: '3',
    name: 'Posto Galp Aeroporto',
    address: 'Estrada do Aeroporto',
    phone: '+244 923 456 793',
    coords: { x: 30, y: 70 },
    location: { lat: -6.1450, lng: 12.3800 },
    status: { gasoline: true, diesel: false, lastUpdated: new Date(Date.now() - 7200000).toISOString() },
    imageUrl: 'https://picsum.photos/id/203/800/400',
    stationCode: 'GALP003',
    openHours: '24 Horas',
    manager: 'Carlos Silva'
  },
  {
    id: '4',
    name: 'Posto Total Sul',
    address: 'Av. da Independência, Bairro Sul',
    phone: '+244 923 456 791',
    coords: { x: 70, y: 80 },
    location: { lat: -6.1500, lng: 12.3550 },
    status: { gasoline: false, diesel: false, lastUpdated: new Date(Date.now() - 10000000).toISOString() },
    imageUrl: 'https://picsum.photos/id/214/800/400',
    stationCode: 'TOTA004',
    openHours: '06:00 - 21:00',
    manager: 'Ana Paula'
  }
];

// Extended User type locally to include password for simulation
interface DBUser extends User {
    password?: string;
}

const SEED_USERS: DBUser[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@fuelsoyo.com',
    role: UserRole.ADMIN,
    password: '123',
    preferences: { email: true, whatsapp: true },
    favorites: []
  },
  {
    id: 'u2',
    name: 'Operador Sonangol',
    email: 'op@sonangol.com',
    role: UserRole.OPERATOR,
    stationId: '1',
    password: '123',
    preferences: { email: true, whatsapp: true },
    favorites: []
  },
  {
    id: 'u3',
    name: 'Motorista Exemplo',
    email: 'motorista@gmail.com',
    role: UserRole.USER,
    password: '123',
    preferences: { email: true, whatsapp: true },
    favorites: ['1', '2']
  },
  {
    id: 'u4',
    name: 'Cliente Teste',
    email: 'cliente@teste.com',
    role: UserRole.USER,
    password: '123',
    preferences: { email: true, whatsapp: false },
    favorites: []
  }
];

// --- Helpers to read/write from LocalStorage ---

const getDB = <T>(key: string, seed: T): T => {
    const data = localStorage.getItem(key);
    if (!data) {
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
    }
    return JSON.parse(data);
};

const setDB = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// Initialize DB
export const INITIAL_STATIONS = getDB<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
export const MOCK_USERS = getDB<DBUser[]>(STORAGE_KEYS.USERS, SEED_USERS); // Exposing for compatibility, but prefer functions below
export const MOCK_REQUESTS = getDB<StationRequest[]>(STORAGE_KEYS.REQUESTS, []);

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// NOTIFICATION SYSTEM SERVICES
// ============================================================================

export const createPushNotification = (
    userId: string, 
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error',
    link?: string
) => {
    const notifs = getDB<AppNotification[]>(STORAGE_KEYS.APP_NOTIFICATIONS, []);
    const newNotif: AppNotification = {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        title,
        message,
        type,
        read: false,
        timestamp: new Date().toISOString(),
        link
    };
    notifs.unshift(newNotif); // Add to top
    setDB(STORAGE_KEYS.APP_NOTIFICATIONS, notifs);
};

export const getMyNotifications = (userId: string, role: UserRole): AppNotification[] => {
    const all = getDB<AppNotification[]>(STORAGE_KEYS.APP_NOTIFICATIONS, []);
    return all.filter(n => {
        if (n.userId === userId) return true;
        if (role === UserRole.ADMIN && n.userId === 'admin') return true;
        if (role === UserRole.USER && n.userId === 'all_users') return true;
        return false;
    });
};

export const markNotificationAsRead = (notifId: string) => {
    const all = getDB<AppNotification[]>(STORAGE_KEYS.APP_NOTIFICATIONS, []);
    const index = all.findIndex(n => n.id === notifId);
    if (index !== -1) {
        all[index].read = true;
        setDB(STORAGE_KEYS.APP_NOTIFICATIONS, all);
    }
};

export const markAllAsRead = (userId: string, role: UserRole) => {
    const all = getDB<AppNotification[]>(STORAGE_KEYS.APP_NOTIFICATIONS, []);
    const updated = all.map(n => {
        const isMine = n.userId === userId || (role === UserRole.ADMIN && n.userId === 'admin') || (role === UserRole.USER && n.userId === 'all_users');
        if (isMine) return { ...n, read: true };
        return n;
    });
    setDB(STORAGE_KEYS.APP_NOTIFICATIONS, updated);
};

// --- Helper to simulate Operator Reminders (Call occasionally) ---
export const checkOperatorStatus = (operatorId: string, stationId: string) => {
    const stations = getDB<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
    const station = stations.find(s => s.id === stationId);
    
    if (station) {
        const lastUpdate = new Date(station.status.lastUpdated).getTime();
        const now = new Date().getTime();
        const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

        if (hoursSinceUpdate > 24) {
            // Check if we already notified recently to avoid spam (simple check)
            const notifs = getDB<AppNotification[]>(STORAGE_KEYS.APP_NOTIFICATIONS, []);
            const recentWarning = notifs.find(n => 
                n.userId === operatorId && 
                n.type === 'warning' && 
                n.timestamp > new Date(Date.now() - 86400000).toISOString() // last 24h
            );

            if (!recentWarning) {
                createPushNotification(
                    operatorId,
                    'Atualização Necessária',
                    `O status do posto ${station.name} não é atualizado há mais de 24h. Por favor, confirme a disponibilidade.`,
                    'warning',
                    '/operator'
                );
            }
        }
    }
};

// ============================================================================
// SERVICE METHODS
// ============================================================================

// --- Notification Logic (Email Simulation & Persistence) ---

const sendEmailNotification = async (to: string, subject: string, message: string) => {
    // 1. Log to Console (for developer)
    console.log(`%c[SERVIDOR DE EMAIL] Enviando para ${to}...`, 'color: cyan; font-weight: bold;');
    
    // 2. Persist to "Server" DB so Admin can see it
    const logs = getDB<EmailLog[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const newLog: EmailLog = {
        id: Math.random().toString(36).substr(2, 9),
        to,
        subject,
        message,
        timestamp: new Date().toISOString(),
        status: 'sent'
    };
    logs.unshift(newLog); // Add to top
    setDB(STORAGE_KEYS.NOTIFICATIONS, logs);

    // 3. (Optional) Here you would call a real API like EmailJS or SendGrid
    // await fetch('https://api.emailjs.com/api/v1.0/email/send', ...);
};

export const getEmailLogs = async (): Promise<EmailLog[]> => {
    await delay(300);
    return getDB<EmailLog[]>(STORAGE_KEYS.NOTIFICATIONS, []);
};

// --- Station Data Services ---

export const getStations = async (): Promise<Station[]> => {
    await delay(300);
    return getDB<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
};

export const getStationById = async (id: string): Promise<Station | undefined> => {
    await delay(300);
    const stations = getDB<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
    return stations.find(s => s.id === id);
};

export const createStation = async (data: { name: string, address: string, phone: string, openHours: string, imageUrl?: string }): Promise<Station> => {
    await delay(500);
    const stations = getDB<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
    
    // Generate code like "SONA1234"
    const prefix = data.name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
    const newStationCode = (prefix || 'POST') + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    // Generate random mock location near Soyo
    const baseLat = -6.1349;
    const baseLng = 12.3689;
    const randomLat = baseLat + (Math.random() - 0.5) * 0.05;
    const randomLng = baseLng + (Math.random() - 0.5) * 0.05;

    const newStation: Station = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        address: data.address,
        phone: data.phone,
        openHours: data.openHours,
        coords: { x: Math.floor(Math.random() * 80) + 10, y: Math.floor(Math.random() * 80) + 10 }, // Random location on mock map
        location: { lat: randomLat, lng: randomLng },
        status: { gasoline: false, diesel: false, lastUpdated: new Date().toISOString() },
        imageUrl: data.imageUrl || `https://picsum.photos/seed/${Math.random()}/800/400`,
        stationCode: newStationCode,
        manager: 'Admin (Manual)'
    };

    stations.push(newStation);
    setDB(STORAGE_KEYS.STATIONS, stations);
    
    // Update exported INITIAL_STATIONS
    const memIndex = INITIAL_STATIONS.findIndex(s => s.id === newStation.id);
    if(memIndex === -1) INITIAL_STATIONS.push(newStation);

    return newStation;
};

export const updateStationDetails = async (id: string, data: Partial<Omit<Station, 'id' | 'status' | 'coords' | 'stationCode'>>): Promise<Station | null> => {
    await delay(500);
    const stations = getDB<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
    const index = stations.findIndex(s => s.id === id);
    
    if (index !== -1) {
        stations[index] = { ...stations[index], ...data };
        setDB(STORAGE_KEYS.STATIONS, stations);
        
        // Update memory
        const memIndex = INITIAL_STATIONS.findIndex(s => s.id === id);
        if (memIndex !== -1) INITIAL_STATIONS[memIndex] = stations[index];

        return stations[index];
    }
    return null;
};

export const updateStationStatus = async (stationId: string, status: Partial<FuelStatus>): Promise<{ success: boolean, notifiedCount: number }> => {
    await delay(600); // Increased delay to simulate email sending time
    const stations = getDB<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
    const index = stations.findIndex(s => s.id === stationId);
    
    if (index !== -1) {
        const station = stations[index];
        const oldStatus = station.status;
        
        // Update data
        stations[index].status = {
            ...station.status,
            ...status,
            lastUpdated: new Date().toISOString()
        };
        setDB(STORAGE_KEYS.STATIONS, stations);
        
        // Update the exported constant reference
        const memIndex = INITIAL_STATIONS.findIndex(s => s.id === stationId);
        if (memIndex !== -1) {
            INITIAL_STATIONS[memIndex] = stations[index];
        }

        // --- Notification Logic ---
        let notifiedCount = 0;
        
        // Filter only regular USERS for notifications
        const allUsers = getDB<DBUser[]>(STORAGE_KEYS.USERS, SEED_USERS);
        
        // Check preferences. If preference object missing, default to true.
        const usersToNotify = allUsers.filter(u => 
            u.role === UserRole.USER && 
            (u.preferences?.email !== false)
        );

        const checks = [
            { type: 'gasoline', label: 'Gasolina', oldVal: oldStatus.gasoline, newVal: status.gasoline },
            { type: 'diesel', label: 'Gasóleo', oldVal: oldStatus.diesel, newVal: status.diesel }
        ];

        let changes: string[] = [];
        let isOverallPositive = false;

        for (const check of checks) {
            // Check if property exists in update object AND if value changed
            if (check.newVal !== undefined && check.newVal !== check.oldVal) {
                const statusStr = check.newVal ? 'DISPONÍVEL 🟢' : 'ESGOTADO 🔴';
                changes.push(`${check.label}: ${statusStr}`);
                
                if (check.newVal === true) isOverallPositive = true;

                // Send Emails for BOTH Availability and Depletion
                const subject = check.newVal 
                    ? `[FuelSoyo] Corre! ${check.label} disponível em ${station.name}`
                    : `[FuelSoyo] Alerta: ${check.label} acabou em ${station.name}`;

                const body = check.newVal
                    ? `Olá,\n\nBoas notícias! O posto ${station.name} acabou de informar que há ${check.label} disponível.\n\nLocalização: ${station.address}\n\nCorra antes que acabe!`
                    : `Olá,\n\nInformamos que o estoque de ${check.label} no posto ${station.name} acabou de esgotar.\n\nEvite a viagem perdida. Avisaremos quando for reabastecido.`;

                for (const user of usersToNotify) {
                    await sendEmailNotification(
                        user.email, 
                        subject, 
                        `Olá ${user.name},\n\n${body}`
                    );
                    notifiedCount++;
                }
            }
        }

        // Send App Push Notification to all users (Dashboard Alert)
        if (changes.length > 0) {
            const message = changes.join('. ');
            // Warning/Error color if everything is empty, Success if something became available
            const type = isOverallPositive ? 'success' : 'error';
            
            createPushNotification(
                'all_users',
                `Atualização: ${station.name}`,
                message,
                type,
                `/stations/${station.id}`
            );
        }
        
        return { success: true, notifiedCount };
    }
    return { success: false, notifiedCount: 0 };
};

export const updateStationImage = async (stationId: string, imageUrl: string) => {
    const stations = getDB<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
    const index = stations.findIndex(s => s.id === stationId);
    if (index !== -1) {
        stations[index].imageUrl = imageUrl;
        setDB(STORAGE_KEYS.STATIONS, stations);
        // Update memory cache
        const memIndex = INITIAL_STATIONS.findIndex(s => s.id === stationId);
        if (memIndex !== -1) INITIAL_STATIONS[memIndex] = stations[index];
        return true;
    }
    return false;
};

export const deleteStation = async (id: string): Promise<boolean> => {
    await delay(500);
    const stations = getDB<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
    const filtered = stations.filter(s => s.id !== id);

    if (stations.length === filtered.length) return false; // Not found

    setDB(STORAGE_KEYS.STATIONS, filtered);
    
    // Update memory cache
    const memIndex = INITIAL_STATIONS.findIndex(s => s.id === id);
    if (memIndex !== -1) INITIAL_STATIONS.splice(memIndex, 1);

    return true;
};

export const generateStationImage = async (station: Station): Promise<string | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: `A photorealistic image of a modern gas station named "${station.name}" in Soyo, Angola. Sunny day, realistic environment, cars, blue sky, high resolution.` }
                ]
            },
            config: {
                imageConfig: { aspectRatio: "16:9" }
            }
        });
        
        // Extract image
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Failed to generate image", error);
        return null;
    }
};

// --- Auth Services ---

export const findUserByEmail = async (email: string): Promise<DBUser | undefined> => {
    await delay(300);
    const users = getDB<DBUser[]>(STORAGE_KEYS.USERS, SEED_USERS);
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const createUser = async (user: Omit<DBUser, 'id'>): Promise<DBUser> => {
    await delay(500);
    const users = getDB<DBUser[]>(STORAGE_KEYS.USERS, SEED_USERS);
    
    const newUser: DBUser = {
        id: Math.random().toString(36).substr(2, 9),
        ...user,
        preferences: { email: true, whatsapp: true }, // Default preferences
        favorites: []
    };
    
    users.push(newUser);
    setDB(STORAGE_KEYS.USERS, users);
    
    // Notify Admin about new user registration if needed
    if (newUser.role === UserRole.OPERATOR) {
         createPushNotification(
            'admin',
            'Novo Operador Cadastrado',
            `${newUser.name} criou uma conta de operador.`,
            'info'
        );
    }
    
    return newUser;
};

export const updateUserPreferences = async (userId: string, prefs: { email: boolean, whatsapp: boolean }) => {
    await delay(200);
    const users = getDB<DBUser[]>(STORAGE_KEYS.USERS, SEED_USERS);
    const index = users.findIndex(u => u.id === userId);
    
    if (index !== -1) {
        users[index].preferences = prefs;
        setDB(STORAGE_KEYS.USERS, users);
        return true;
    }
    return false;
};

export const toggleUserFavorite = async (userId: string, stationId: string): Promise<string[]> => {
    const users = getDB<DBUser[]>(STORAGE_KEYS.USERS, SEED_USERS);
    const index = users.findIndex(u => u.id === userId);
    
    if (index !== -1) {
        const user = users[index];
        const favorites = user.favorites || [];
        
        let newFavorites: string[];
        if (favorites.includes(stationId)) {
            newFavorites = favorites.filter(id => id !== stationId);
        } else {
            newFavorites = [...favorites, stationId];
        }

        users[index].favorites = newFavorites;
        setDB(STORAGE_KEYS.USERS, users);
        return newFavorites;
    }
    return [];
};

export const validateStationCode = async (code: string): Promise<Station | null> => {
    await delay(300);
    const stations = getDB<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
    return stations.find(s => s.stationCode === code) || null;
};

// --- Station Request Services ---

export const addStationRequest = async (data: Omit<StationRequest, 'id' | 'status' | 'date'>) => {
    await delay(800);
    const requests = getDB<StationRequest[]>(STORAGE_KEYS.REQUESTS, []);
    
    const newRequest: StationRequest = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        status: 'pending',
        date: new Date().toISOString()
    };
    
    requests.push(newRequest);
    setDB(STORAGE_KEYS.REQUESTS, requests);

    // Trigger Admin Notification
    createPushNotification(
        'admin',
        'Nova Solicitação de Posto',
        `Solicitação recebida de ${data.managerName} para o posto ${data.stationName}.`,
        'info',
        '/admin'
    );

    return true;
};

export const getPendingRequests = async () => {
    await delay(500);
    const requests = getDB<StationRequest[]>(STORAGE_KEYS.REQUESTS, []);
    return requests.filter(r => r.status === 'pending');
};

export const approveStationRequest = async (requestId: string, imageUrl?: string) => {
    await delay(1000);
    const requests = getDB<StationRequest[]>(STORAGE_KEYS.REQUESTS, []);
    const reqIndex = requests.findIndex(r => r.id === requestId);
    
    if (reqIndex === -1) return null;

    // Update request status
    requests[reqIndex].status = 'approved';
    const req = requests[reqIndex];
    setDB(STORAGE_KEYS.REQUESTS, requests);

    // Create new station
    const stations = getDB<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
    const newStationCode = req.stationName.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    // Generate random location
    const baseLat = -6.1349;
    const baseLng = 12.3689;
    
    const newStation: Station = {
        id: Math.random().toString(36).substr(2, 9),
        name: req.stationName,
        address: req.address,
        phone: req.phone,
        coords: { x: 50, y: 50 }, // Central default
        location: { 
            lat: baseLat + (Math.random() - 0.5) * 0.04, 
            lng: baseLng + (Math.random() - 0.5) * 0.04 
        },
        status: { gasoline: false, diesel: false, lastUpdated: new Date().toISOString() },
        // Use provided image or fallback to mock
        imageUrl: imageUrl || `https://picsum.photos/seed/${req.id}/800/400`,
        stationCode: newStationCode,
        openHours: '08:00 - 18:00',
        manager: req.managerName // Assign manager from request
    };

    stations.push(newStation);
    setDB(STORAGE_KEYS.STATIONS, stations);
    
    // Update exported INITIAL_STATIONS
    INITIAL_STATIONS.push(newStation);

    // --- NOTIFICATION BLITZ FOR NEW STATION ---
    // 1. Notify users via Push/Dashboard
    createPushNotification(
        'all_users',
        'Novo Posto Cadastrado!',
        `O posto ${newStation.name} foi adicionado ao sistema. Confira a localização.`,
        'success',
        `/stations/${newStation.id}`
    );

    // 2. Simulate Emails to all registered drivers
    const usersToNotify = getDB<DBUser[]>(STORAGE_KEYS.USERS, SEED_USERS).filter(u => u.role === UserRole.USER && u.preferences?.email !== false);
    for (const user of usersToNotify) {
        await sendEmailNotification(
            user.email,
            `Novo Posto em Soyo: ${newStation.name}`,
            `Olá ${user.name}, um novo posto foi cadastrado no FuelSoyo: ${newStation.name} localizado em ${newStation.address}.`
        );
    }

    return newStation;
};

export const rejectStationRequest = async (requestId: string) => {
    await delay(500);
    const requests = getDB<StationRequest[]>(STORAGE_KEYS.REQUESTS, []);
    const reqIndex = requests.findIndex(r => r.id === requestId);
    
    if (reqIndex !== -1) {
        requests[reqIndex].status = 'rejected';
        setDB(STORAGE_KEYS.REQUESTS, requests);
        return true;
    }
    return false;
};

// --- Reporting Services (Mock) ---

export const generateReports = async (startDate: string, endDate: string) => {
    await delay(800);
    const stations = getDB<Station[]>(STORAGE_KEYS.STATIONS, SEED_STATIONS);
    const users = getDB<DBUser[]>(STORAGE_KEYS.USERS, SEED_USERS);

    // Deterministic random generator based on station ID and date to keep charts consistent during session
    const pseudoRandom = (seed: string) => {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(Math.sin(hash) * 10000) % 1;
    };

    // 1. Availability Report
    const availabilityReport: AvailabilityReportItem[] = stations.map(s => {
        const rand = pseudoRandom(s.id + startDate);
        const hours = 24 * 30; // approx monthly hours
        return {
            stationName: s.name,
            gasolineAvailability: Math.floor(60 + (rand * 40)), // 60-100%
            dieselAvailability: Math.floor(50 + (rand * 45)),   // 50-95%
            totalHoursTracked: hours,
            downtimeHours: Math.floor(hours * (1 - (60 + rand * 40)/100))
        };
    });

    // 2. Operator Activity Report
    const operatorReport: OperatorActivityReportItem[] = [];
    const operators = users.filter(u => u.role === UserRole.OPERATOR && u.stationId);
    
    operators.forEach(op => {
        const station = stations.find(s => s.id === op.stationId);
        if (station) {
            const rand = pseudoRandom(op.id + endDate);
            operatorReport.push({
                operatorName: op.name,
                stationName: station.name,
                totalUpdates: Math.floor(10 + rand * 50),
                averageResponseTime: Math.floor(5 + rand * 25), // minutes
                lastActive: new Date(Date.now() - Math.floor(rand * 10000000)).toISOString()
            });
        }
    });

    // 3. Popularity Report
    const popularityReport: PopularityReportItem[] = stations.map(s => {
        const rand = pseudoRandom(s.id + 'pop');
        return {
            stationName: s.name,
            views: Math.floor(500 + rand * 5000),
            favorites: Math.floor(20 + rand * 300),
            searchAppearances: Math.floor(1000 + rand * 10000)
        };
    });

    // Sort by popularity
    popularityReport.sort((a, b) => b.views - a.views);

    return {
        availability: availabilityReport,
        activity: operatorReport,
        popularity: popularityReport
    };
};