import postgres from 'postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
// Import the mock revenue data
import { revenue as mockRevenue } from './placeholder-data';

// Improved database configuration with better timeout settings and connection options
const sql = postgres(process.env.POSTGRES_URL!, { 
  ssl: 'require',
  timeout: 60000, // Increase timeout to 60 seconds
  max: 5, // Limit max connections in the pool
  idle_timeout: 30, // Close idle connections after 30 seconds
  connect_timeout: 30, // Connection timeout of 30 seconds
  debug: true, // Enable debugging to see what's happening with connections
});

// Use this flag to toggle between mock data and real database data
const USE_MOCK_DATA = false;

export async function fetchRevenue() {
  try {
    if (USE_MOCK_DATA) {
      console.log('Using mock revenue data instead of database connection');
      return mockRevenue as Revenue[];
    }
    
    // No artificial delay when connecting to real DB
    console.log('Fetching revenue data from database...');
    const data = await sql<Revenue[]>`SELECT * FROM revenue`;
    console.log('Revenue data fetched successfully');
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    // Fallback to mock data if the database connection fails
    console.log('Falling back to mock revenue data');
    return mockRevenue as Revenue[];
  }
}

export async function fetchLatestInvoices() {
  try {
    if (USE_MOCK_DATA) {
      // Use mock data instead of actual database query
      console.log('Using mock latest invoices data instead of database connection');
    
      // Create mock data that matches the expected return structure
      const mockLatestInvoices = [
        {
          id: '3958dc9e-712f-4377-85e9-fec4b6a6442a',
          name: 'John Smith',
          email: 'john@example.com',
          image_url: '/customers/delba-de-oliveira.png',
          amount: '$350.00',
        },
        {
          id: '3958dc9e-742f-4377-85e9-fec4b6a6442a',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          image_url: '/customers/sarah-johnson.png',
          amount: '$250.00',
        },
        {
          id: '3958dc9e-737f-4377-85e9-fec4b6a6442a',
          name: 'Michael Brown',
          email: 'michael@example.com',
          image_url: '/customers/amy-burns.png',
          amount: '$550.00',
        },
        {
          id: '5958dc9e-712f-4377-85e9-fec4b6a6442a',
          name: 'Emily Davis',
          email: 'emily@example.com',
          image_url: '/customers/balazs-orban.png',
          amount: '$150.00',
        },
        {
          id: '5858dc9e-712f-4377-85e9-fec4b6a6442a',
          name: 'Alex Wilson',
          email: 'alex@example.com',
          image_url: '/customers/evil-rabbit.png',
          amount: '$450.00',
        },
      ];
    
      return mockLatestInvoices;
    }
    
    console.log('Fetching latest invoices from database...');
    const data = await sql<LatestInvoiceRaw[]>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    console.log('Latest invoices fetched successfully');
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    // If database connection fails, return mock data
    console.log('Falling back to mock latest invoices data');
    return [
      {
        id: '3958dc9e-712f-4377-85e9-fec4b6a6442a',
        name: 'John Smith',
        email: 'john@example.com',
        image_url: '/customers/delba-de-oliveira.png',
        amount: '$350.00',
      },
      {
        id: '3958dc9e-742f-4377-85e9-fec4b6a6442a',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        image_url: '/customers/sarah-johnson.png',
        amount: '$250.00',
      },
      {
        id: '3958dc9e-737f-4377-85e9-fec4b6a6442a',
        name: 'Michael Brown',
        email: 'michael@example.com',
        image_url: '/customers/amy-burns.png',
        amount: '$550.00',
      },
      {
        id: '5958dc9e-712f-4377-85e9-fec4b6a6442a',
        name: 'Emily Davis',
        email: 'emily@example.com',
        image_url: '/customers/balazs-orban.png',
        amount: '$150.00',
      },
      {
        id: '5858dc9e-712f-4377-85e9-fec4b6a6442a',
        name: 'Alex Wilson',
        email: 'alex@example.com',
        image_url: '/customers/evil-rabbit.png',
        amount: '$450.00',
      },
    ];
  }
}

export async function fetchCardData() {
  try {
    if (USE_MOCK_DATA) {
      // Use mock data instead of actual database queries
      console.log('Using mock card data instead of database connection');
    
      // Create mock data that matches the expected return structure
      const mockCardData = {
        numberOfCustomers: 100,
        numberOfInvoices: 250,
        totalPaidInvoices: '$15,000.00',
        totalPendingInvoices: '$5,800.00',
      };
    
      return mockCardData;
    }
    
    console.log('Fetching card data from database...');
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0][0].count ?? '0');
    const numberOfCustomers = Number(data[1][0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2][0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2][0].pending ?? '0');

    console.log('Card data fetched successfully');
    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    // Fallback to mock data if the database connection fails
    console.log('Falling back to mock card data');
    return {
      numberOfCustomers: 100,
      numberOfInvoices: 250,
      totalPaidInvoices: '$15,000.00',
      totalPendingInvoices: '$5,800.00',
    };
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await sql<InvoicesTable[]>`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const data = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm[]>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const customers = await sql<CustomerField[]>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql<CustomersTableType[]>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
