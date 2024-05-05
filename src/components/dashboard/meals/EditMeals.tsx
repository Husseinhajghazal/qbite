"use client";

import Input from "@/components/Input/Input";
import React, { useEffect, useState } from "react";
import { FaCircle, FaInfoCircle } from "react-icons/fa";
import { BiCategoryAlt } from "react-icons/bi";
import { MdImage, MdDeleteOutline } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { ImEqualizer } from "react-icons/im";
import { FieldArray, useFormik, FormikProvider } from "formik";
import { LuImagePlus } from "react-icons/lu";
import SelectInput from "@/components/Input/SelectInput";
import EmojiPicker from "@/components/Input/EmojiPicker";
import { mealForm } from "@/types/Meal";
import * as Yup from "yup";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { RootState } from "@/store/store";
import { useSelector } from "react-redux";
import { Meal } from "@/app/dashboard/meals/edit/[id]/page";
import { Category } from "@/types/Category";
import { Currency } from "@/types/Currency";
import {
  changeTextLanguage,
  getCurrencyValue,
  nameToSlug,
  updatePrice,
} from "@/utils/helpers";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import editMeal from "@/services/editMeal";
import usePending from "@/hooks/usePending";
import { addTranslation } from "@/services/language";
import { MealDetail } from "@/types/MealDetail";
import { useRouter } from "next/navigation";
import { IoLanguageSharp } from "react-icons/io5";
import { languagesList } from "@/Data/languagesList";
import { useTranslation } from "react-i18next";

const CreateMeal = ({
  details,
  Meal,
  categoriesData,
  Currencies,
}: {
  details: MealDetail[];
  Meal: Meal;
  categoriesData: Category[];
  Currencies: Currency[];
}) => {
  const session = useSession();

  const router = useRouter();

  const languageState = useSelector(
    (state: RootState) => state.language.language
  ) as "en" | "ar";
  const [t, i18n] = useTranslation("global");

  const [oldImages, setOldImages] = useState(Meal.images);

  const oldImagesDelete = (id: number) => {
    let temp = oldImages;
    temp = temp.filter((e) => e.id !== id);
    setOldImages(temp);
  };

  const initialValues: mealForm = {
    images: [null],
    name: Meal.name.fallback,
    price: Meal.prices[0].price.toString(),
    description: Meal.description.fallback,
    category: Meal.category.id,
    dishData: details.map((e, index) => ({
      icon: e.icon,
      value: Meal.details[index] ? Meal.details[index].value : "0",
      unit: e.unit.fallback,
    })),
    currency: Meal.prices[0].currencyId.toString(),
    language: languageState,
  };

  const validationSchema = Yup.object({
    name: Yup.string().required("Required."),
    price: Yup.string().required("Required."),
    description: Yup.string().required("Required."),
    currency: Yup.string().required("Required."),
  });

  const { isPending, mutate } = useMutation({
    mutationFn: (body: Record<string, any>) =>
      editMeal(Meal.id, session.data?.user.token!, body),
    onError: (error: any) => {
      if (error.response.status === 401) {
        signOut();
      }
      toast.error(error.response.data.message);
    },
    onSuccess: (data) => {
      toast.success(data.data.message);
      router.replace("/dashboard/meals");
    },
  });

  usePending({ isPending, message: "updating Your Meal..." });

  const submitHandler = (values: mealForm) => {
    let body: Record<string, any> = {};
    body.slug = nameToSlug(Meal.name.fallback || values.name);
    body.categoryId = values.category;
    body.prices = updatePrice(+values.currency, +values.price, Meal.prices);
    body.defaultImgIndex = "0";
    body.images = oldImages;
    body.details = [];
    addTranslation(
      body,
      "name",
      values.name,
      Meal.name,
      formik.values.language as "ar" | "en"
    );
    addTranslation(
      body,
      "description",
      values.description,
      Meal.description,
      formik.values.language as "ar" | "en"
    );
    body.productImages = values.images.slice(0, values.images.length - 1);
    body.language = values.language;

    mutate(body);
  };

  const formik = useFormik({
    initialValues: initialValues,
    onSubmit: submitHandler,
    validationSchema: validationSchema,
  });

  useEffect(() => {
    formik.setFieldValue(
      "price",
      getCurrencyValue(+formik.values.currency, Meal.prices)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.currency]);

  useEffect(() => {
    formik.setFieldValue(
      "dishData",
      formik.values.dishData.map((e, index) => ({
        ...e,
        unit: details[index]
          ? changeTextLanguage(
              details[index].unit,
              formik.values.language as "en" | "ar",
              details[index].unit.fallback
            )
          : e.unit,
      }))
    );
    formik.setFieldValue(
      "description",
      changeTextLanguage(
        Meal.description,
        formik.values.language as "en" | "ar",
        ""
      )
    );
    formik.setFieldValue(
      "name",
      changeTextLanguage(Meal.name, formik.values.language as "en" | "ar", "")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.language]);

  return (
    <div
      dir={i18n.language == "ar" ? "rtl" : "ltr"}
      className={`${
        i18n.language == "ar" ? "pr-[94px] pl-[26px]" : "pl-[94px] pr-[26px]"
      } pt-4 bg-white h-screen pb-2 lg:pb-4`}
    >
      <div className="flex gap-2 items-center pb-4 border-b-2">
        <FaCircle color="#3fb56c" size={14} className="mt-1" />
        <h1 className="text-3xl font-semibold">
          {t("dashboard.meals.edit.title")}
        </h1>
      </div>
      <form className="min-h-[90%] text-center" onSubmit={formik.handleSubmit}>
        <div className="py-4 grid md:grid-cols-12 gap-3 border-b-2 text-start">
          <div className="md:col-span-3">
            <h4 className="font-semibold flex items-center gap-1">
              <MdImage color="#3fb56c" size={20} />{" "}
              {t("dashboard.meals.edit.images.title")}
            </h4>
            <p className="text-sm text-gray-500">
              {t("dashboard.meals.edit.images.p")}
            </p>
          </div>
          <div className="md:col-span-9 overflow-scroll">
            <FormikProvider value={formik}>
              <FieldArray
                name="images"
                render={({ push, remove }) => (
                  <div className="flex gap-2">
                    {oldImages.map((image) => (
                      <div
                        key={image.id}
                        className="relative w-[100px] h-[100px] rounded-lg shadow-sm flex items-center justify-center"
                      >
                        <button
                          type="button"
                          onClick={() => oldImagesDelete(image.id)}
                          className="absolute top-2 left-2 text-rose-600 duration-300 hover:text-rose-800 hover:scale-125"
                        >
                          <RxCross2 />
                        </button>
                        <Image
                          alt="food"
                          src={
                            process.env.NEXT_PUBLIC_IMAGE_URL + image.imageURL
                          }
                          width={500}
                          height={500}
                          className="object-fit"
                        />
                      </div>
                    ))}
                    {formik.values.images.map((image, index) => (
                      <div key={index}>
                        {image ? (
                          <div className="relative w-[100px] h-[100px] rounded-lg shadow-sm flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="absolute top-2 left-2 text-rose-600 duration-300 hover:text-rose-800 hover:scale-125"
                            >
                              <RxCross2 />
                            </button>
                            <Image
                              alt="food"
                              src={URL.createObjectURL(image)}
                              width={500}
                              height={500}
                              className="object-fit"
                            />
                          </div>
                        ) : (
                          <div className="w-[100px] h-[100px] bg-gray-200 rounded-lg shadow-sm flex items-center justify-center">
                            <input
                              type="file"
                              className="sr-only"
                              id={`images[${index}]`}
                              accept=".jpg,.jpeg,.png"
                              onChange={(e) => {
                                const selectedFile = e.target?.files?.[0];
                                if (selectedFile) {
                                  formik.setFieldValue(
                                    `images[${index}]`,
                                    selectedFile
                                  );
                                  push(null);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                document
                                  .getElementById(`images[${index}]`)
                                  ?.click()
                              }
                            >
                              <LuImagePlus size={40} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              />
            </FormikProvider>
          </div>
        </div>
        <div className="py-4 grid md:grid-cols-12 gap-3 border-b-2 text-start">
          <div className="md:col-span-3">
            <h4 className="font-semibold flex items-center gap-1">
              <FaInfoCircle color="#3fb56c" size={20} />{" "}
              {t("dashboard.meals.edit.info.title")}
            </h4>
            <p className="text-sm text-gray-500">
              {t("dashboard.meals.edit.info.p")}
            </p>
          </div>
          <div className="md:col-span-9">
            <div className="flex flex-col md:flex-row gap-3 mb-3">
              <Input
                type="text"
                className="w-full"
                placeholder={t("dashboard.meals.edit.info.inputs.1")}
                id="name"
                value={formik.values.name}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                valid={formik.touched.name && formik.errors.name}
                error={formik.errors.name}
              />
              <div className="w-full flex">
                <Input
                  type="number"
                  className="w-full"
                  placeholder={t("dashboard.meals.edit.info.inputs.2")}
                  id="price"
                  value={formik.values.price}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  valid={formik.touched.price && formik.errors.price}
                  error={formik.errors.price}
                />
                <select
                  className="outline-none"
                  id="currency"
                  value={formik.values.currency}
                  onChange={formik.handleChange}
                >
                  {Currencies.map((e) => (
                    <option value={e.id} key={e.id}>
                      {e.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              type="textarea"
              className="w-full"
              placeholder={t("dashboard.meals.edit.info.inputs.3")}
              id="description"
              value={formik.values.description}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              valid={formik.touched.description && formik.errors.description}
              error={formik.errors.description}
            />
          </div>
        </div>
        <div className="py-4 grid md:grid-cols-12 gap-3 border-b-2 text-start">
          <div className="md:col-span-3">
            <h4 className="font-semibold flex items-center gap-1">
              <BiCategoryAlt color="#3fb56c" size={20} />{" "}
              {t("dashboard.meals.edit.category.title")}
            </h4>
            <p className="text-sm text-gray-500">
              {t("dashboard.meals.edit.category.p")}
            </p>
          </div>
          <div className="md:col-span-9">
            <SelectInput
              className="md:w-1/2"
              placeholder={t("dashboard.meals.edit.category.input")}
              id="category"
              value={formik.values.category}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              valid={formik.touched.category && formik.errors.category}
              error={formik.errors.category}
              array={categoriesData}
            />
          </div>
        </div>
        <div className="py-4 grid md:grid-cols-12 gap-3 border-b-2 text-start">
          <div className="md:col-span-3">
            <h4 className="font-semibold flex items-center gap-1">
              <ImEqualizer color="#3fb56c" size={20} />{" "}
              {t("dashboard.meals.edit.data.title")}
            </h4>
            <p className="text-sm text-gray-500">
              {t("dashboard.meals.edit.data.p")}
            </p>
          </div>
          <div className="md:col-span-9">
            <FormikProvider value={formik}>
              <FieldArray
                name="dishData"
                render={({ push, remove }) => (
                  <div>
                    {formik.values.dishData.map((dish, index) => (
                      <div key={index} className="relative flex gap-3 mb-4">
                        <EmojiPicker
                          x="bottom-0"
                          y="left-20"
                          icon={dish.icon}
                          onChange={(e) =>
                            formik.setFieldValue(`dishData[${index}].icon`, e)
                          }
                        />
                        <div className="flex">
                          <div>
                            <input
                              type="text"
                              id={`dishData[${index}].value`}
                              value={dish.value}
                              onBlur={formik.handleBlur}
                              onChange={formik.handleChange}
                              placeholder="Value"
                              className={`border-2 ${
                                i18n.language == "ar"
                                  ? "rounded-r-full border-l-0"
                                  : "rounded-l-full border-r-0"
                              } w-full py-2 px-4 outline-none duration-300 border-gray-300 focus:border-[#2f834f] hover:border-[#2f834f] caret-[#71c381]`}
                            />
                          </div>
                          <div className="w-16">
                            <input
                              type="text"
                              id={`dishData[${index}].unit`}
                              value={dish.unit.slice(0, 3)}
                              onBlur={formik.handleBlur}
                              onChange={formik.handleChange}
                              placeholder="Unit"
                              className={`border-2 w-full ${
                                i18n.language == "ar"
                                  ? "rounded-l-full"
                                  : "rounded-r-full"
                              } py-2 px-4 outline-none duration-300 border-gray-300 focus:border-[#2f834f] hover:border-[#2f834f] caret-[#71c381]`}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="px-3 text-[14px] bg-rose-200 text-rose-900 rounded-md font-semibold duration-300 hover:bg-rose-100"
                        >
                          <MdDeleteOutline size={20} />
                        </button>
                      </div>
                    ))}
                    {/* <button
                      type="button"
                      onClick={() => push({ icon: "🔥", value: "", unit: "" })}
                      className="px-5 py-2 text-[14px] bg-green-200 text-green-800 rounded-md font-semibold duration-300 hover:bg-green-100"
                    >
                      Add Input
                    </button> */}
                  </div>
                )}
              />
            </FormikProvider>
          </div>
        </div>
        <div className="py-4 grid md:grid-cols-12 gap-3 border-b-2 text-start">
          <div className="col-span-3">
            <h4 className="font-semibold flex items-center gap-1">
              <IoLanguageSharp color="#3fb56c" size={20} />{" "}
              {t("dashboard.meals.edit.language.title")}
            </h4>
            <p className="text-sm text-gray-500">
              {t("dashboard.meals.edit.language.p")}
            </p>
          </div>
          <div className="col-span-9">
            <SelectInput
              className="md:w-1/2"
              placeholder="Choose Language"
              id="language"
              value={formik.values.language}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
              valid={formik.touched.language && formik.errors.language}
              error={formik.errors.language}
              array={languagesList}
            />
          </div>
        </div>
        <button
          type="submit"
          className="my-4 mx-auto px-5 py-2 text-lg bg-green-800 text-white rounded-lg font-semibold duration-300 hover:bg-green-600"
        >
          {t("dashboard.meals.edit.button")}
        </button>
      </form>
    </div>
  );
};

export default CreateMeal;
