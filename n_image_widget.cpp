#include "n_image_widget.h"
#include "ui_n_image_widget.h"

NImageWidget::NImageWidget(QWidget *parent) : QWidget(parent), ui(new Ui::NImageWidget)
{
    ui->setupUi(this);

    mProjectDir = new QDir(QDir::homePath());

    mFileSysteMmodel = new QFileSystemModel;
    mFileSysteMmodel->setReadOnly(false);
    ui->imageTreeView->setModel(mFileSysteMmodel);
    ui->imageTreeView->hideColumn(1);
    ui->imageTreeView->hideColumn(2);
    ui->imageTreeView->hideColumn(3);
    ui->imageTreeView->hideColumn(4);
}

void NImageWidget::setCurrentProject(QString dirPath) {
    mProjectDir->setPath(dirPath);
    mProjectName = mProjectDir->dirName();

    QString imageDirPath = mProjectDir->absoluteFilePath("image");
    mFileSysteMmodel->setRootPath(imageDirPath);
    //特定のディレクトリ以降のみを表示するための設定
    ui->imageTreeView->setRootIndex(mFileSysteMmodel->index(imageDirPath));

    ui->imageTabWidget->clear();
}

NImageWidget::~NImageWidget()
{
    delete ui;
}
