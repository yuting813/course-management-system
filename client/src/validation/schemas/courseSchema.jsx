import Joi from 'joi';

const courseSchema = Joi.object({
  title: Joi.string().min(6).max(100).required(),
  description: Joi.string().min(6).max(500).required(),
  price: Joi.number().min(10).max(9999).required(),
  image: Joi.string().allow('', null),
});

export default courseSchema;
