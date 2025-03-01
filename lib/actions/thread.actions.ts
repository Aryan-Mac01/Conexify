"use server"

import User from "../models/user.model";
import Thread from "../models/thread.model";
import { connectToDB } from "../mongoose"
import { revalidatePath } from "next/cache";

interface Params{
    text: string,
    author: string,
    communityId: string | null,
    path: string,
}

export async function createThread({ text, author, communityId, path }: Params){
    try {
        connectToDB();
        const createThread = await Thread.create({
          text,
          author,
          community: null,
        });

        //update user model
        await User.findByIdAndUpdate(author, {
          $push: { threads: createThread._id },
        });

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Error creating thread: ${error.message}`)
    }
} 

export async function fetchPosts(pageNumber = 1, pageSize = 20){
  connectToDB();

  //Calculate the number of posts to skip
  const skipAmount = (pageNumber - 1) * pageSize;

  //Fetch posts that have no parents (top-level threads...)
  const postsQuery = Thread.find({ parentId: { $in: [null, undefined]}})
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(pageSize)
    .populate({ path: 'author', model: User })
    .populate({
      path: 'children',
      populate: {
        path: 'author',
        model: User,
        select: "_id name parentId image"
      }
    })

    const totalPostsCount = await Thread.countDocuments({ parentId: { $in: [null, undefined]} })

    const posts = await postsQuery.exec();

    const isNext = totalPostsCount > skipAmount + posts.length;

    return { posts, isNext }
}

export async function fetchThreadById(id: string){
  connectToDB();

  try {
    //TODO: Populate community
    const thread = await Thread.findById(id)
    .populate({ 
      path: 'author', 
      model: User, 
      select: "_id id name image" 
    })
    .populate({
      path: 'children',
      populate: [
        {
          path: 'author',
          model: User,
          select: "_id id name parentId image"
        },
        {
          path: 'children',
          model: Thread,
          populate: {
            path: 'author',
            model: User,
            select: "_id id name parentId image"
          }
        }
      ]
    }).exec();
    return thread;
  } catch (error: any) {
    throw new Error(`Error fetchind thread: ${error.message}`)
  }
}