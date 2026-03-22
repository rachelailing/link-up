import { $, $$ } from '../../utils/dom.js';
import { setActiveNav } from '../../components/navbar.js';
import { jobsService } from '../../services/jobs.service.js';
import { authService } from '../../services/auth.service.js';

function setError(id, msg) {
  const el = document.querySelector(`[data-error-for="${id}"]`);
  if (el) el.textContent = msg || '';
}

function clearErrors() {
  $$('[data-error-for]').forEach((e) => (e.textContent = ''));
}

async function init() {
  setActiveNav();

  const user = await authService.requireAuth('student');
  if (!user) return;

  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('id');

  if (!jobId) {
    window.location.href = './jobs.html';
    return;
  }

  const job = await jobsService.getJobById(jobId);

  if (!job) {
    document.querySelector('.container').innerHTML = `
      <div class="card pad">
        <p>Job not found.</p>
        <a class="btn btn-outline" href="./jobs.html">Back to Jobs</a>
      </div>
    `;
    return;
  }

  // Fill job preview
  $('#jobTitle').textContent = job.title;
  $('#jobEmployer').textContent = job.employer_name || 'Employer';
  $('#jobLocation').textContent = `📍 ${job.location}`;
  $('#jobSalary').textContent = `💰 RM ${job.salary}`;
  $('#jobDeposit').textContent = `💳 Fee RM ${job.deposit}`;
  $('#jobDeadline').textContent = `📅 ${job.deadline || '-'}`;
  $('#jobDescription').textContent = job.description || '';

  $('#applyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const message = $('#message').value.trim();
    const availability = $('#availability').value;

    let ok = true;
    if (message.length < 10) {
      setError('message', 'Please write at least 10 characters.');
      ok = false;
    }
    if (!availability) {
      setError('availability', 'Please select availability.');
      ok = false;
    }
    if (!ok) return;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      console.log(`[ApplyJob] Attempting to apply for job ID: ${jobId} as student ID: ${user.id}`);

      const result = await jobsService.applyForJob(jobId, user.id, message);

      console.log('[ApplyJob] Application success result:', result);
      alert('Application submitted successfully! ✅');

      // Redirect to the applications list page
      window.location.href = '/pages/student/job-section.html';
    } catch (err) {
      console.error('[ApplyJob] Submission error caught in controller:', err);

      if (err.code === '23505') {
        alert('You have already applied for this job.');
      } else if (err.message && err.message.includes('row-level security')) {
        alert('Permission denied: Please ensure you are registered as a student.');
      } else {
        alert('Error submitting application: ' + (err.message || 'Unknown error'));
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Application';
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
