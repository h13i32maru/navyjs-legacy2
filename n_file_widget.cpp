#include "n_file_widget.h"

NFileWidget::NFileWidget(const QDir &projectDir, const QString &filePath, QWidget *parent) : QWidget(parent)
{
    mProjectDir = projectDir;
    mFilePath = filePath;
}

bool NFileWidget::isChanged() {
    return mChanged;
}

void NFileWidget::changed() {
    mChanged = true;

    emit this->changed(mFilePath);
}
