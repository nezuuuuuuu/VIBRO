using OpenCvSharp;
using OpenCvSharp.Extensions;
using System;
using System.Collections;
using System.Drawing;
using Point = OpenCvSharp.Point;

namespace CoinsActivity
{
    internal class ImageProcess
    {
        public static void DetectCoins(ref Bitmap a, ref Bitmap b, ref Label coinCount, ref Label coinDenomination)
        {
            if (a == null)
            {
                MessageBox.Show("No images have been loaded");
            }

            using (Mat originalMat = BitmapConverter.ToMat(a))
            using (Mat processedMat = originalMat.Clone())
            using (var gray = new Mat())
            using (var blur = new Mat())
            using (var canny = new Mat())
            {
                Cv2.CvtColor(processedMat, gray, ColorConversionCodes.BGR2GRAY);
                Cv2.GaussianBlur(gray, blur, new OpenCvSharp.Size(7, 7), 0);
                Cv2.Canny(blur, canny, 15, 120);
                Cv2.Dilate(canny, canny, new Mat(), null, 2);

                Point[][] contours;
                HierarchyIndex[] hierarchyIndex;
                Cv2.FindContours(canny, out contours, out hierarchyIndex, mode: RetrievalModes.External, method: ContourApproximationModes.ApproxSimple);

                int coin_count = 0;
                double total_amount = 0;
                ArrayList coin_heights = new ArrayList();
                foreach (var c in contours)
                {
                    coin_count++;
                    var rect = Cv2.BoundingRect(c);
                    Cv2.Rectangle(processedMat, new OpenCvSharp.Point(rect.X, rect.Y), new OpenCvSharp.Point(rect.X + rect.Width -2, rect.Y + rect.Height -2), Scalar.DarkGreen, 2);
                    coin_heights.Add(rect.Height);
                    if(rect.Height >= 64 & rect.Height <= 65)
                    {
                        total_amount += 0.05;
                    }
                    else if (rect.Height >= 68 & rect.Height <= 71)
                    {
                        total_amount += 0.1;
                    }
                    else if (rect.Height >= 80 & rect.Height <= 82)
                    {
                        total_amount += 0.25;
                    }
                    else if (rect.Height >= 94 & rect.Height <= 97)
                    {
                        total_amount += 1;
                    }
                    else if (rect.Height >= 106 & rect.Height <= 110)
                    {
                        total_amount += 5;
                    }

                }

                //MessageBox.Show("Coin count: " + coin_count); 
                //coin_heights.Sort();
                //MessageBox.Show("Coin Heights: " + string.Join(", ", coin_heights.ToArray()));
                coinCount.Text = coin_count.ToString();
                coinDenomination.Text = total_amount.ToString();
                //MessageBox.Show($"Total Coin Denomination:{ total_amount:F2}");
                b = BitmapConverter.ToBitmap(processedMat);
            }
        }
    }
}