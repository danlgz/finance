import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt';

// GET - Get current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        households: {
          include: {
            household: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH - Update user profile 
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { name, email, currentPassword, newPassword } = data;

    // Validate data
    const updates: any = {};
    
    if (name) {
      updates.name = name;
    }
    
    // If trying to change email, check if it's already used
    if (email && email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: 'Email already in use' },
          { status: 400 }
        );
      }
      
      updates.email = email;
    }

    // If trying to change password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }

      // Verify current password
      const user = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          password: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Hash new password
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    // Update user
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: 'No changes to update' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 