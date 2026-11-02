from app.core.database import Base
from app.models.user import User, UserProfile
from app.models.academic import Course, Topic, StudentCoursePreference, StudentAvailability
from app.models.support import SupportRequest, SupportSession, SessionReview
from app.models.material import StudyMaterial, ContentReport
from app.models.study_group import StudyGroup, StudyGroupMember
from app.models.opportunity import (
    Opportunity,
    OpportunityFavorite,
    OpportunityTracking,
    ProjectIdea,
    ProjectTeamApplication,
    GuideArticle,
)
from app.models.goal import LearningGoal
from app.models.notification import Notification
from app.models.pomodoro import PomodoroSession

__all__ = [
    "Base",
    "User",
    "UserProfile",
    "Course",
    "Topic",
    "StudentCoursePreference",
    "StudentAvailability",
    "SupportRequest",
    "SupportSession",
    "SessionReview",
    "StudyMaterial",
    "ContentReport",
    "StudyGroup",
    "StudyGroupMember",
    "Opportunity",
    "OpportunityFavorite",
    "OpportunityTracking",
    "ProjectIdea",
    "ProjectTeamApplication",
    "GuideArticle",
    "LearningGoal",
    "Notification",
    "PomodoroSession",
]
