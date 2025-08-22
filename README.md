# Financial Health Management Dashboard 💰

A comprehensive financial management application built with Next.js that helps users track their income, expenses, and financial health with real-time analytics and interactive visualizations.

## 🚀 Features

### Core Functionality
- **Real-time Dashboard**: Dynamic overview of financial metrics with key performance indicators
- **Transaction Management**: Full CRUD operations for income and expense tracking
- **Analytics Dashboard**: Comprehensive financial analytics with visual charts and insights
- **Category-based Spending**: Intelligent categorization of expenses with visual breakdowns
- **AI-Powered Chatbot**: Integrated financial assistant for guidance and support

### Data Visualization
- **Interactive Pie Charts**: Visual representation of income vs expenses and category spending
- **Responsive Charts**: Built with Recharts for smooth, interactive data visualization
- **Progress Bars**: Visual spending indicators for each category
- **Real-time Updates**: Live data updates without page refresh

### User Experience
- **Modern UI/UX**: Clean, responsive design with Tailwind CSS
- **Mobile-First**: Fully responsive design optimized for all devices
- **Intuitive Navigation**: Easy-to-use interface with clear navigation
- **Dark/Light Mode**: Automatic theme detection based on user preference

## 🏗️ Architecture & Data Flow

### Technology Stack
```
Frontend: Next.js 15.5.0 + React 19.1.0
Styling: Tailwind CSS
Database: MongoDB Atlas
Charts: Recharts
AI Assistant: N8N Chatbot Integration
```

### Data Flow Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │───▶│   Next.js App    │───▶│   MongoDB       │
│   (Transactions)│    │   (Frontend)     │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   API Routes     │
                       │   (Backend)      │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Analytics      │
                       │   Processing     │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Dashboard      │
                       │   Visualization  │
                       └──────────────────┘
```

### Database Schema
```javascript
Transaction Schema:
{
  _id: ObjectId,
  type: String, // "income" | "expense"
  amount: Number,
  category: String,
  description: String,
  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── data/
│   │       └── route.js          # CRUD API endpoints
│   ├── analytics/
│   │   └── page.js               # Analytics dashboard
│   ├── transactions/
│   │   └── page.js               # Transaction management
│   ├── layout.js                 # Global layout with chatbot
│   ├── page.js                   # Main dashboard
│   └── globals.css               # Global styles
├── lib/
│   ├── mongodb.js                # Database connection
│   ├── crudHelpers.js            # CRUD utility functions
│   └── analytics.js              # Analytics calculations
└── public/                       # Static assets
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- npm or yarn package manager

### Environment Setup
1. Clone the repository:
```bash
git clone <repository-url>
cd sunhack
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
# Create .env.local file
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=your_database_name
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### MongoDB Setup
1. Create a MongoDB Atlas cluster
2. Set up a database (e.g., "financial_db")
3. Create a collection (e.g., "transactions")
4. Add connection string to environment variables

## 🔧 Configuration

### Database Configuration
The application uses MongoDB with Mongoose for data management. Configuration is handled in `src/lib/mongodb.js`.

### API Routes
- `GET /api/data` - Fetch all transactions
- `POST /api/data` - Create new transaction
- `PUT /api/data` - Update existing transaction
- `DELETE /api/data` - Delete transaction

### Environment Variables
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=financial_db
```

## 📊 Features Deep Dive

### Dashboard Analytics
- **Total Balance**: Real-time calculation of income minus expenses
- **Monthly Trends**: Track financial patterns over time
- **Category Analysis**: Breakdown of spending by categories
- **Visual Charts**: Interactive pie charts for better insights

### Transaction Types
1. **Income Sources**:
   - Salary
   - Freelance
   - Investments
   - Other income streams

2. **Expense Categories**:
   - Food & Dining
   - Transportation
   - Shopping
   - Bills & Utilities
   - Entertainment
   - Healthcare
   - Other expenses

### Analytics Features
- **All-time Data**: Comprehensive view of financial history
- **Category Insights**: Detailed spending patterns
- **Visual Representations**: Charts and graphs for better understanding
- **Export Capabilities**: Data export for external analysis

## 🤖 AI Chatbot Integration

The application includes an intelligent chatbot powered by N8N for:
- Financial advice and guidance
- Transaction queries and insights
- Budget planning assistance
- Financial goal setting

## 🎨 UI/UX Design

### Design Principles
- **Minimalist**: Clean, clutter-free interface
- **Intuitive**: Easy navigation and clear call-to-actions
- **Responsive**: Optimized for desktop, tablet, and mobile
- **Accessible**: WCAG compliant design standards

### Color Scheme
- Primary: Blue tones for trust and stability
- Success: Green for positive financial metrics
- Warning: Yellow for attention areas
- Danger: Red for expenses and alerts

## 🚀 Deployment

### Vercel Deployment (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Alternative Deployment Options
- **Netlify**: Static site deployment
- **Railway**: Full-stack deployment
- **DigitalOcean**: VPS deployment

## 🔐 Security Features

- **Environment Variables**: Secure configuration management
- **Input Validation**: Client and server-side validation
- **Database Security**: MongoDB Atlas security features
- **HTTPS**: Secure data transmission

## 📈 Performance Optimization

- **Next.js App Router**: Optimized routing and rendering
- **Server-Side Rendering**: Fast initial page loads
- **Image Optimization**: Automatic image compression
- **Code Splitting**: Reduced bundle sizes
- **Caching**: Efficient data caching strategies

## 🧪 Testing & Development

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Quality
- ESLint configuration for code consistency
- Prettier for code formatting
- React best practices implementation
- Performance monitoring and optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow React/Next.js best practices
- Use TypeScript for type safety (if applicable)
- Write descriptive commit messages
- Add documentation for new features

## 📝 API Documentation

### Transaction API

#### GET /api/data
Retrieve all transactions
```javascript
Response: {
  success: boolean,
  data: Transaction[]
}
```

#### POST /api/data
Create new transaction
```javascript
Request Body: {
  type: "income" | "expense",
  amount: number,
  category: string,
  description: string,
  date: string
}
```

#### PUT /api/data
Update transaction
```javascript
Request Body: {
  _id: string,
  // ... other fields to update
}
```

#### DELETE /api/data
Delete transaction
```javascript
Request Body: {
  _id: string
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MongoDB URI in environment variables
   - Check network connectivity
   - Ensure database user has proper permissions

2. **Build Errors**
   - Clear `.next` folder and rebuild
   - Check Node.js version compatibility
   - Verify all dependencies are installed

3. **Chart Rendering Issues**
   - Ensure Recharts is properly installed
   - Check data format for charts
   - Verify responsive container implementation

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting guide

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for reliable database services
- Recharts for beautiful data visualizations
- Tailwind CSS for efficient styling
- The open-source community for continuous inspiration

---

Built with ❤️ using Next.js, React, and MongoDB
