import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() { 
    //Prisma Queries

    //Create User
    const user = await prisma.user.create({
        data: {
            name: "Madesh",
            email: "madesh@outlook.com"
        }
    })

    //Get all users
    const users = await prisma.user.findMany();

    //Create an article and associate it with user "Madesh"
    const article = await prisma.article.create({
        data: {
            title: 'Madesh\'s first article',
            Body: 'This is Madesh\'s first article\'s body',
            author: {
                connect: {
                    id: 1
                }
            }
        }
    })

    //Get all articles
    const articles = await prisma.article.findMany()

    //Create user and article and associate them
    const userWithArticle = await prisma.user.create({
        data: {
            name: 'Sara Tendulkar',
            email: 'sara@outlook.com',
            articles: {
                create: {
                    title: 'Sara\'s first article',
                    Body: 'This is Sara\'s first article'
                }
            }
        }
    })

    //Create another article
    const articleAgain = await prisma.article.create({
        data: {
            title: 'Sample Article',
            Body: 'This is a sample article',
            author: {
                connect: {
                    id: 2
                }
            }
        }
    })

    //Loop over Sara's articles
    users.forEach((user) => {
        console.log(`User: ${user.name}, Email: ${user.email}`);
        console.log('Articles: ');
        // user.articles.forEach((article) => {
        //     console.log(`-- Title: ${article.title}, Body: ${article.Body}`);
        // })
    })

    //Update data
    const updateUser = await prisma.user.update({
        where: {
            id: 1
        },
        data: {
            name: 'madesh Jr'
        }
    })

    //Delete data
    const deleteArticle = await prisma.article.delete({
        where: {
            id: 2
        } 
    })
    console.log(users);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });