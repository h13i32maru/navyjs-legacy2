#ifndef N_IMAGE_WIDGET_H
#define N_IMAGE_WIDGET_H

#include <QDir>
#include <QFileSystemModel>
#include <QWidget>

namespace Ui {
class NImageWidget;
}

class NImageWidget : public QWidget
{
    Q_OBJECT

public:
    explicit NImageWidget(QWidget *parent = 0);
    void setCurrentProject(QString dirPath);
    ~NImageWidget();

private:
    Ui::NImageWidget *ui;
    QDir *mProjectDir;
    QString mProjectName;
    QString mRootDirName;
    QFileSystemModel *mFileSysteMmodel;
};

#endif // N_IMAGE_WIDGET_H
