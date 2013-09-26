#include "n_image_widget.h"
#include "ui_n_image_widget.h"

#include <QLabel>

NImageWidget::NImageWidget(const QDir &projectDir, const QString &filePath, QWidget *parent) : NFileWidget(projectDir, filePath, parent), ui(new Ui::NImageWidget)
{
    ui->setupUi(this);
    mImageLabel = ui->imageLabel;
    mImageLabel->setPixmap(QPixmap(filePath));
}

bool NImageWidget::save() {
    return true;
}

NImageWidget::~NImageWidget()
{
    delete ui;
}
