import { clientPromise } from '@/lib/mongodb';
import { Task, UrlStatus, TaskStatus } from '@/types';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { urlIdToUpdate, newStatus, newProgressPercentage } = await req.json();
    const { id: taskId } = params;

    const client = await clientPromise;
    const db = client.db();
    const tasksCollection = db.collection<Task>('tasks');
    const urlsCollection = db.collection('urls');

    const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) });
    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    const urls = await urlsCollection.find({}).toArray();
    let allUrlsForTask = new Set<string>(task.assignedUrlIds || []);
    (task.assignedAgencyIds || []).forEach((agencyId: string) => {
      urls.filter(u => u.agencyId === agencyId).forEach(u => allUrlsForTask.add(u._id.toString()));
    });

    let currentProgressDetails = task.urlProgressDetails || [];

    allUrlsForTask.forEach(urlId => {
      if (!currentProgressDetails.some(detail => detail.urlId === urlId)) {
        currentProgressDetails.push({ urlId: urlId, status: 'pending', progressPercentage: 0 });
      }
    });

    let detailToUpdate = currentProgressDetails.find(detail => detail.urlId === urlIdToUpdate);

    if (!detailToUpdate) {
      detailToUpdate = { urlId: urlIdToUpdate, status: 'pending', progressPercentage: 0 };
      currentProgressDetails.push(detailToUpdate);
    }

    detailToUpdate.status = newStatus;
    if (newProgressPercentage !== undefined) {
      detailToUpdate.progressPercentage = Math.max(0, Math.min(100, newProgressPercentage));
    }

    if (newStatus === 'completed') detailToUpdate.progressPercentage = 100;
    if (newStatus === 'pending') detailToUpdate.progressPercentage = 0;
    if (newStatus === 'in-progress' && detailToUpdate.progressPercentage === 100) detailToUpdate.status = 'completed';
    if (newStatus === 'in-progress' && detailToUpdate.progressPercentage === 0) detailToUpdate.status = 'pending';

    let overallStatus: TaskStatus = 'pending';
    if (currentProgressDetails.length > 0) {
      const allCompleted = currentProgressDetails.every(d => d.status === 'completed');
      const anyInProgress = currentProgressDetails.some(d => d.status === 'in-progress');

      if (allCompleted) {
        overallStatus = 'completed';
      } else if (anyInProgress) {
        overallStatus = 'in-progress';
      } else {
        const anyPending = currentProgressDetails.some(d => d.status === 'pending');
        if (anyPending) {
          overallStatus = 'in-progress'
        }
      }
    }

    await tasksCollection.updateOne({ _id: new ObjectId(taskId) }, {
      $set: {
        urlProgressDetails: currentProgressDetails,
        status: overallStatus
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
