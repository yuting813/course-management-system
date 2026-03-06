import axios from './axios.service';
const API_URL = '/courses';

function handleError(error) {
  console.error('發生錯誤:', error);
}

class CourseService {
  post(title, description, price, image) {
    return axios.post(API_URL, { title, description, price, image });
  }

  async getEnrolledCourses(studentId) {
    try {
      const response = await axios.get(`${API_URL}/student/${studentId}`);
      return response.data;
    } catch (error) {
      handleError(error);
      return [];
    }
  }

  async getInstructorCourses(instructorId) {
    try {
      const response = await axios.get(`${API_URL}/instructor/${instructorId}`);
      return response.data;
    } catch (error) {
      handleError(error);
      return [];
    }
  }

  getCourseByName(keyword) {
    return axios.get(`${API_URL}`, {
      params: { keyword },
    });
  }

  getAllCourses() {
    return axios.get(API_URL);
  }

  enroll(courseId) {
    return axios.post(`${API_URL}/enroll/${courseId}`);
  }

  delete(courseId) {
    return axios.delete(`${API_URL}/${courseId}`);
  }

  async dropCourse(courseId) {
    try {
      const response = await axios.post(`${API_URL}/drop/${courseId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        // 服務器回應了錯誤狀態碼
        throw new Error(error.response.data.message || '退選課程失敗');
      } else if (error.request) {
        // 請求已發出，但沒有收到回應
        throw new Error('無法連接到服務器');
      } else {
        // 在設置請求時發生了錯誤
        throw new Error('發生錯誤: ' + error.message);
      }
    }
  }

  // 更新課程方法
  update(courseId, updatedData) {
    return axios
      .patch(`${API_URL}/${courseId}`, updatedData)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        if (error.response) {
          throw new Error(error.response.data);
        }
        throw new Error('更新課程時發生錯誤');
      });
  }
}

const courseService = new CourseService();
export default courseService;
