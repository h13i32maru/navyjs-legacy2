#include "n_image_widget.h"
#include "ui_n_image_widget.h"

#include <QLabel>

NImageWidget::NImageWidget(QWidget *parent) : NFileTabEditor(parent), ui(new Ui::NImageWidget)
{
    ui->setupUi(this);

    mRootDirName = "image";
    mFileExtension = "";
    mContextNewFileLabel = tr("&Image");

    init(ui->fileTreeView, ui->fileTabWidget);
}

QWidget *NImageWidget::createTabWidget(const QString &filePath) {
    QLabel *label = new QLabel();
    label->setPixmap(QPixmap(filePath));
    return label;
}

QString NImageWidget::editedFileContent(QWidget* /* widget */) {
    return NULL;
}

NImageWidget::~NImageWidget()
{
    delete ui;
}
