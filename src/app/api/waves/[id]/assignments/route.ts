import { clientPromise } from '@/lib/mongodb';
import { Wave, Task, WaveAssignment } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { waveDescription, assignments } = await req.json();
    const { id: waveId } = params;

    const client = await clientPromise;
    const db = client.db();
    const wavesCollection = db.collection<Wave>('waves');
    const tasksCollection = db.collection<Task>('tasks');
    const urlsCollection = db.collection('urls');

    const wave = await wavesCollection.findOne({ _id: new ObjectId(waveId) });
    if (!wave) {
      return new NextResponse('Wave not found', { status: 404 });
    }

    if (wave.description !== waveDescription) {
      await wavesCollection.updateOne({ _id: new ObjectId(waveId) }, { $set: { description: waveDescription } });
    }

    const userIdsWithAssignments = Object.keys(assignments);
    const existingTasksForWave = await tasksCollection.find({ waveId }).toArray();

    for (const userId of userIdsWithAssignments) {
      const userAssignment = assignments[userId];
      if (!userAssignment) continue;

      const urls = await urlsCollection.find({}).toArray();
      const allAssignedUrlsForUser = new Set<string>(userAssignment.assignedUrlIds);
      userAssignment.assignedAgencyIds.forEach((agencyId: string) => {
        urls.filter(u => u.agencyId === agencyId).forEach(u => allAssignedUrlsForUser.add(u._id.toString()));
      });
      const allUrlIds = Array.from(allAssignedUrlsForUser);

      const existingTask = existingTasksForWave.find(t => t.userId === userId);

      if (existingTask) {
        const newProgressDetails = allUrlIds.map(urlId => {
          return existingTask.urlProgressDetails?.find(d => d.urlId === urlId) || { urlId, status: 'pending', progressPercentage: 0 };
        });

        await tasksCollection.updateOne({ _id: new ObjectId(existingTask._id) }, {
          $set: {
            title: `Wave ${wave.number}: ${wave.name}`,
            description: waveDescription,
            assignedAgencyIds: userAssignment.assignedAgencyIds,
            assignedUrlIds: userAssignment.assignedUrlIds,
            urlProgressDetails: newProgressDetails,
          }
        });
      } else {
        const urlProgressDetails = allUrlIds.map(urlId => ({
          urlId, status: 'pending', progressPercentage: 0
        }));

        const newTask: Omit<Task, 'id'> = {
          title: `Wave ${wave.number}: ${wave.name}`,
          description: waveDescription,
          userId,
          waveId,
          assignedAgencyIds: userAssignment.assignedAgencyIds,
          assignedUrlIds: userAssignment.assignedUrlIds,
          urlProgressDetails,
          status: 'pending',
          comments: [],
        };
        await tasksCollection.insertOne(newTask as Task);
      }
    }

    const userIdsWithoutAssignments = existingTasksForWave
      .filter(t => !userIdsWithAssignments.includes(t.userId))
      .map(t => new ObjectId(t._id));

    if (userIdsWithoutAssignments.length > 0) {
      await tasksCollection.deleteMany({ _id: { $in: userIdsWithoutAssignments } });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
